'use client'

import Document from '@/components/Document'
import React, { use } from 'react'

const Page = ({params}:{ params: Promise<{ id: string }> }) => {
  const { id } = use(params);
  console.log('Document page render:', { id });
  return (
    <div className='h-full'>
        <Document id={id}/>
    </div>
  )
}

export default Page