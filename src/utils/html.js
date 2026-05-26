export const sanitizeHtml = (value) => {
  if (!value) return ''

  if (typeof window === 'undefined') {
    return String(value)
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
      .replace(/\son\w+="[^"]*"/gi, '')
  }

  const allowedTags = new Set(['P', 'BR', 'STRONG', 'B', 'EM', 'I', 'U', 'UL', 'OL', 'LI', 'DIV'])
  const template = document.createElement('template')
  template.innerHTML = String(value)

  template.content.querySelectorAll('script, style').forEach((node) => node.remove())
  template.content.querySelectorAll('*').forEach((node) => {
    if (!allowedTags.has(node.tagName)) {
      node.replaceWith(...node.childNodes)
      return
    }

    Array.from(node.attributes).forEach((attribute) => node.removeAttribute(attribute.name))
  })

  return template.innerHTML
}

export const stripHtml = (value) => {
  if (!value) return ''

  if (typeof window === 'undefined') {
    return String(value).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  }

  const element = document.createElement('div')
  element.innerHTML = sanitizeHtml(value)
  return element.textContent.replace(/\s+/g, ' ').trim()
}
