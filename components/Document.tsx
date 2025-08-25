"use client"

import Editor from "./Editor"

const Document = ({id}:{
 id:string
}) => {
  return (
    <div className="h-full w-full flex flex-col">
      <Editor/>
    </div>
  )
}

export default Document