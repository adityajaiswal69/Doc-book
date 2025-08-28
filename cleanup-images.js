#!/usr/bin/env node

/**
 * Image Storage Cleanup Script
 * 
 * This script helps clean up orphaned images and files marked for deletion
 * from the Supabase storage bucket.
 * 
 * Usage: node cleanup-images.js
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function cleanupDeletedImages() {
  console.log('🧹 Cleaning up images marked for deletion...\n');

  try {
    // Get all images marked for deletion
    const { data: deletedImages, error: queryError } = await supabase
      .from('storage_images')
      .select('id, file_path, mode, deleted_at, document_id, block_id')
      .eq('mode', 'upload')
      .not('deleted_at', 'is', null)
      .not('file_path', 'is', null);

    if (queryError) {
      console.error('❌ Error querying deleted images:', queryError.message);
      return;
    }

    if (!deletedImages || deletedImages.length === 0) {
      console.log('✅ No images marked for deletion found');
      return;
    }

    console.log(`📋 Found ${deletedImages.length} images marked for deletion:`);
    deletedImages.forEach((img, i) => {
      console.log(`   ${i + 1}. ${img.file_path} (deleted: ${img.deleted_at})`);
    });

    let deletedCount = 0;
    let errors = [];

    // Delete each file from storage
    for (const image of deletedImages) {
      try {
        const { error: storageError } = await supabase.storage
          .from('images')
          .remove([image.file_path]);

        if (storageError) {
          console.error(`❌ Failed to delete ${image.file_path}:`, storageError.message);
          errors.push(`${image.file_path}: ${storageError.message}`);
        } else {
          console.log(`✅ Deleted: ${image.file_path}`);
          deletedCount++;
        }
      } catch (error) {
        console.error(`❌ Error deleting ${image.file_path}:`, error.message);
        errors.push(`${image.file_path}: ${error.message}`);
      }
    }

    // Remove database records for successfully deleted files
    if (deletedCount > 0) {
      const { error: dbCleanupError } = await supabase
        .from('storage_images')
        .delete()
        .not('deleted_at', 'is', null)
        .eq('mode', 'upload');

      if (dbCleanupError) {
        console.warn('⚠️  Warning: Could not clean up database records:', dbCleanupError.message);
      } else {
        console.log(`🗄️  Cleaned up ${deletedCount} database records`);
      }
    }

    console.log(`\n📊 Cleanup Summary:`);
    console.log(`   ✅ Successfully deleted: ${deletedCount} files`);
    console.log(`   ❌ Errors: ${errors.length}`);
    
    if (errors.length > 0) {
      console.log('\n❌ Error details:');
      errors.forEach(error => console.log(`   - ${error}`));
    }

  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
  }
}

async function cleanupOrphanedImages() {
  console.log('\n🔍 Checking for orphaned images...\n');

  try {
    // Get orphaned images using the database function
    const { data: orphanedImages, error: orphanedError } = await supabase
      .rpc('get_orphaned_images');

    if (orphanedError) {
      console.error('❌ Error fetching orphaned images:', orphanedError.message);
      return;
    }

    if (!orphanedImages || orphanedImages.length === 0) {
      console.log('✅ No orphaned images found');
      return;
    }

    console.log(`📋 Found ${orphanedImages.length} orphaned images:`);
    orphanedImages.forEach((img, i) => {
      console.log(`   ${i + 1}. ${img.file_path} (document: ${img.document_id})`);
    });

    let deletedCount = 0;

    // Delete files from storage
    for (const image of orphanedImages) {
      if (image.file_path) {
        try {
          const { error: storageError } = await supabase.storage
            .from('images')
            .remove([image.file_path]);

          if (storageError) {
            console.error(`❌ Failed to delete orphaned file: ${image.file_path}`, storageError.message);
          } else {
            console.log(`✅ Deleted orphaned file: ${image.file_path}`);
            deletedCount++;
          }
        } catch (error) {
          console.error(`❌ Error deleting orphaned file ${image.file_path}:`, error.message);
        }
      }
    }

    // Clean up database records
    if (deletedCount > 0) {
      const { data: cleanupData, error: cleanupError } = await supabase
        .rpc('cleanup_orphaned_images');

      if (cleanupError) {
        console.error('❌ Error cleaning up orphaned images from database:', cleanupError.message);
      } else {
        console.log(`🗄️  Cleaned up orphaned database records: ${cleanupData}`);
      }
    }

    console.log(`\n📊 Orphaned Cleanup Summary:`);
    console.log(`   ✅ Successfully deleted: ${deletedCount} orphaned files`);

  } catch (error) {
    console.error('❌ Error during orphaned cleanup:', error.message);
  }
}

async function getStorageStats() {
  console.log('\n📊 Storage Statistics:\n');

  try {
    // Get storage stats using the database function
    const { data: stats, error: statsError } = await supabase
      .rpc('get_storage_stats');

    if (statsError) {
      console.error('❌ Error fetching storage stats:', statsError.message);
      return;
    }

    console.log('📈 Storage Overview:');
    console.log(`   📁 Total images: ${stats.total_images}`);
    console.log(`   ⬆️  Uploaded images: ${stats.uploaded_images}`);
    console.log(`   🔗 External images: ${stats.external_images}`);
    console.log(`   🗑️  Deleted images: ${stats.deleted_images}`);
    console.log(`   💾 Total storage used: ${(stats.total_size / (1024 * 1024)).toFixed(2)} MB`);

  } catch (error) {
    console.error('❌ Error fetching storage stats:', error.message);
  }
}

async function main() {
  console.log('🚀 Starting Image Storage Cleanup...\n');
  console.log('ℹ️  This script will clean up:');
  console.log('   1. Images marked for deletion in the database');
  console.log('   2. Orphaned images (files without valid document references)');
  console.log('');

  await getStorageStats();
  await cleanupDeletedImages();
  await cleanupOrphanedImages();

  console.log('\n✨ Cleanup completed!');
  console.log('\n💡 Tips:');
  console.log('   - Run this script periodically to keep storage clean');
  console.log('   - Check the logs if you see any errors');
  console.log('   - Images are automatically cleaned up when blocks are deleted');
}

// Run the cleanup if this script is called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { cleanupDeletedImages, cleanupOrphanedImages, getStorageStats };
