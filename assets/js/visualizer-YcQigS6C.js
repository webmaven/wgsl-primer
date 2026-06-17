var e=class extends Error{constructor(...e){super(...e),this.visualizer_error=!0}},t=class extends Error{constructor(e){super(`compilation failure:
`+e.map(e=>`:${e.line}:${e.column}: ${e.kind}: ${e.msg}`).join(`
`)),this.diagnostics=e}};export{e as n,t};