'use client'

import Document from '@/components/Document'
import React, { use } from 'react'

const page = ({params}:{ params: Promise<{ id: string }> }) => {
  const { id } = use(params);
  return (
    <div className=''>
        <Document id={id}/>
    </div>
  )
}

export default page