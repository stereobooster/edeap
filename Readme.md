# Euler Diagrams Drawn with Ellipses Area-Proportionally (Edeap)

Fork of https://github.com/mjwybrow/edeap

## TODO

- [ ] check if it is possible to implement server side version of `textDimentions`
  - pass it as param so it would be possible to have versions for server and client
- [ ] callback for color
- [ ] demo (host online)
  - add `@upsetjs/venn.js` for comparison
  - add pan/zoom to SVG
- [ ] memoization
- [ ] add test for `generateDefaultLayout`
- [ ] use same format as `venn.js`

```ts
// https://github.com/upsetjs/venn.js/blob/main/src/index.d.ts
export interface ISetOverlap {
  sets: string[];
  size: number;
}
```

## Ideas

Alternatives to clientside `textDimentions`:

- [resvg-js](https://github.com/yisibl/resvg-js)?
- [canvas](https://github.com/Brooooooklyn/canvas)
  - [measureText](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/measureText)

npm packages:

- https://www.npmjs.com/package/get-text-width
- https://github.com/Evgenus/js-server-text-width
- https://www.npmjs.com/package/text-width
- https://github.com/adambisek/string-pixel-width
