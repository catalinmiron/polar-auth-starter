// CSS module wildcard — allows `import './global.css'`
declare module '*.css' {
  const content: never
  export default content
}
