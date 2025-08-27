"use client"

import Editor from "./Editor"

const Document = ({id}:{
 id:string
}) => {
  console.log('Document component render:', { id });
  return (
    <div className="h-full w-full flex flex-col">
      <Editor documentId={id}/>
    </div>
  )
}

export default Document