"use client"

import { Copy, Check } from "lucide-react"
import { useState } from "react"

export default function ChatMessage({ message }) {
  const [copied, setCopied] = useState(false)
  const isUser = message.role === "user"

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Enhanced markdown rendering
  const renderContent = (content) => {
    if (message.isImage) {
      return <img src={content || "/placeholder.svg"} alt="Generated" className="max-w-xl rounded-lg border" />
    }

    if (message.isError) {
      return <p className="text-red-600 dark:text-red-400">{content}</p>
    }

    // Split by code blocks first
    const parts = content.split(/```([\s\S]*?)```/)
    return (
      <div className="space-y-2">
        {parts.map((part, i) => {
          if (i % 2 === 0) {
            // Regular text - process line by line
            const lines = part.split("\n")
            const elements: JSX.Element[] = []
            let listItems: JSX.Element[] = []
            let orderedListItems: JSX.Element[] = []
            let listStart = -1
            let orderedListStart = -1

            const flushList = (index: number) => {
              if (listItems.length > 0) {
                elements.push(
                  <ul key={`ul-${listStart}`} className="list-disc ml-6 my-2 space-y-1">
                    {listItems}
                  </ul>
                )
                listItems = []
                listStart = -1
              }
              if (orderedListItems.length > 0) {
                elements.push(
                  <ol key={`ol-${orderedListStart}`} className="list-decimal ml-6 my-2 space-y-1">
                    {orderedListItems}
                  </ol>
                )
                orderedListItems = []
                orderedListStart = -1
              }
            }

            lines.forEach((line, j) => {
              // Headers
              if (line.startsWith("### ")) {
                flushList(j)
                elements.push(
                  <h5 key={j} className="text-base font-semibold mt-3 mb-1">
                    {renderInlineMarkdown(line.slice(4))}
                  </h5>
                )
              } else if (line.startsWith("## ")) {
                flushList(j)
                elements.push(
                  <h4 key={j} className="text-lg font-semibold mt-4 mb-2">
                    {renderInlineMarkdown(line.slice(3))}
                  </h4>
                )
              } else if (line.startsWith("# ")) {
                flushList(j)
                elements.push(
                  <h3 key={j} className="text-xl font-bold mt-4 mb-2">
                    {renderInlineMarkdown(line.slice(2))}
                  </h3>
                )
              }
              // Unordered lists
              else if (line.match(/^[\s]*[-*]\s+/)) {
                if (orderedListItems.length > 0) {
                  flushList(j)
                }
                if (listStart === -1) listStart = j
                const content = line.replace(/^[\s]*[-*]\s+/, "")
                listItems.push(
                  <li key={j} className="leading-7">
                    {renderInlineMarkdown(content)}
                  </li>
                )
              }
              // Ordered lists
              else if (line.match(/^[\s]*\d+\.\s+/)) {
                if (listItems.length > 0) {
                  flushList(j)
                }
                if (orderedListStart === -1) orderedListStart = j
                const content = line.replace(/^[\s]*\d+\.\s+/, "")
                orderedListItems.push(
                  <li key={j} className="leading-7">
                    {renderInlineMarkdown(content)}
                  </li>
                )
              }
              // Regular paragraphs
              else {
                flushList(j)
                if (line.trim() === "") {
                  elements.push(<br key={j} />)
                } else {
                  elements.push(
                    <p key={j} className="leading-7">
                      {renderInlineMarkdown(line)}
                    </p>
                  )
                }
              }
            })

            flushList(lines.length)
            return <div key={i}>{elements}</div>
          } else {
            // Code block
            const codeContent = part.trim()
            return (
              <div key={i} className="bg-muted rounded-xl p-4 relative group my-4">
                <pre className="text-sm overflow-x-auto">
                  <code>{codeContent}</code>
                </pre>
                <button
                  onClick={() => copyToClipboard(codeContent)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-background/80 hover:bg-background rounded-lg border"
                  title="Copy code"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            )
          }
        })}
      </div>
    )
  }

  // Render inline markdown (bold, italic, inline code, links)
  const renderInlineMarkdown = (text: string) => {
    const elements: (string | JSX.Element)[] = []
    let remaining = text
    let key = 0

    while (remaining.length > 0) {
      // Bold text **text** or __text__
      const boldMatch = remaining.match(/^(\*\*|__)(.*?)\1/)
      if (boldMatch) {
        elements.push(
          <strong key={key++} className="font-bold">
            {boldMatch[2]}
          </strong>
        )
        remaining = remaining.slice(boldMatch[0].length)
        continue
      }

      // Italic text *text* or _text_
      const italicMatch = remaining.match(/^(\*|_)(.*?)\1/)
      if (italicMatch) {
        elements.push(
          <em key={key++} className="italic">
            {italicMatch[2]}
          </em>
        )
        remaining = remaining.slice(italicMatch[0].length)
        continue
      }

      // Inline code `code`
      const codeMatch = remaining.match(/^`([^`]+)`/)
      if (codeMatch) {
        elements.push(
          <code key={key++} className="px-1.5 py-0.5 bg-muted rounded text-sm font-mono">
            {codeMatch[1]}
          </code>
        )
        remaining = remaining.slice(codeMatch[0].length)
        continue
      }

      // Links [text](url)
      const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/)
      if (linkMatch) {
        elements.push(
          <a
            key={key++}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-500 hover:text-cyan-600 underline"
          >
            {linkMatch[1]}
          </a>
        )
        remaining = remaining.slice(linkMatch[0].length)
        continue
      }

      // Regular character
      elements.push(remaining[0])
      remaining = remaining.slice(1)
    }

    return elements
  }

  return (
    <div className="flex gap-3 group">
      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
        <span className="text-sm">{isUser ? "👤" : "🤖"}</span>
      </div>
      <div className="flex-1 space-y-2 pt-1">
        <div className="text-sm font-medium">{isUser ? "You" : "AI"}</div>
        <div className="text-[15px]">
          {renderContent(message.content)}
        </div>
      </div>
    </div>
  )
}
