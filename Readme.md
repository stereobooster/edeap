# Euler Diagrams Drawn with Ellipses Area-Proportionally (Edeap)

Fork of https://github.com/mjwybrow/edeap

## TODO

- [ ] monorepo (turbo)
- [ ] npm package
  - export main class
  - export function sync/async
  - config types
  - constants
  - update `textDimentsions` to be independent of DOM id
- [ ] check if it is possible to implement server side version of `textDimentsions`
  - pass it as param so it would be possible to have versions for server and client
- [ ] callback for color
- [ ] demo (host online)
- [ ] memoization
- [ ] add test for `generateDefaultLayout`

## Ideas

Alternatives to clientside `textDimentsions`:

- [resvg-js](https://github.com/yisibl/resvg-js)?
- [canvas](https://github.com/Brooooooklyn/canvas)
  - [measureText](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/measureText)

npm packages:

- https://www.npmjs.com/package/get-text-width
- https://github.com/Evgenus/js-server-text-width
- https://www.npmjs.com/package/text-width
- https://github.com/adambisek/string-pixel-width
