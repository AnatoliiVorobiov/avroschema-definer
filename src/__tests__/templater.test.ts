import getRenderer, { parseSchema, avscToDefinerCode } from '../templater'

const avroSchema = `
/**
 * Some description
 *
 * @variableName NameFromCommentTag
 */
{
  "namespace": "namespace",
  "type": "record",
  "name": "someRecord",
  "fields": [
    { "name": "field", "aliases": ["first"], "type": { "type": "string", "logicalType": "uuid" }, "doc": "some /* comment in doc */ // field" },
    { "name": "arr", "order": "ascending", "type": { "type": "array", "items": "string" }, "doc": "some field" },
    { "name": "union", "type": ["string", "null"], "doc": "some union field", "default": "some_string" },
    { "name": "fixed", "type": { "type": "fixed", "size": 10, "logicalType": "decimal", "precision": 10, "scale": 10 }, "doc": "some's union field's" },
    { "name": "map", "type": { "type": "map", "values": "string" }, "doc": "some union field" },
    { "name": "enum", "type": { "type": "enum", "symbols": ["some", "any"], "default": "some" } }
  ]
}`

describe('avsc templating', () => {
  it('`parseSchema` works correctly', () => {
    expect(parseSchema(avroSchema)).toEqual({
      comment: {
        description: 'Some description',
        tags: {
          variableName: {
            description: '',
            line: 4,
            name: 'NameFromCommentTag',
            optional: false,
            source: '@variableName NameFromCommentTag',
            tag: 'variableName',
            type: ''
          }
        }
      },
      schema: {
        namespace: 'namespace',
        type: 'record',
        name: 'someRecord',
        fields: [
          { name: 'field', aliases: ['first'], type: { type: 'string', logicalType: 'uuid' }, doc: 'some /* comment in doc */ // field' },
          { doc: 'some field', order: 'ascending', name: 'arr', type: { type: 'array', items: 'string' } },
          { doc: 'some union field', name: 'union', type: ['string', 'null'], default: 'some_string' },
          { name: 'fixed', type: { type: 'fixed', size: 10, logicalType: 'decimal', precision: 10, scale: 10 }, doc: 'some\'s union field\'s' },
          { name: 'map', type: { type: 'map', values: 'string' }, doc: 'some union field' },
          { name: 'enum', type: { type: 'enum', symbols: ['some', 'any'], default: 'some' } }
        ]
      },
      avscToDefinerCode
    })
  })

  it('template(avsc.to.typescript.ejs)', () => {
    expect(getRenderer()(avroSchema)).toEqual(
`import A from 'avroschema-definer'

/**
 * Some description
 */
const NameFromCommentTag = A.name('someRecord').namespace('namespace').record({
  /**
   * @avro-aliases first
   * @avro-doc some \\/* comment in doc *\\/ // field
   */
  field: A.string().logicalType('uuid').doc('some /* comment in doc */ // field').aliases('first'),
  /**
   * @avro-order ascending
   * @avro-doc some field
   */
  arr: A.array(A.string()).doc('some field').order('ascending'),
  /**
   * @avro-doc some union field
   * @avro-default some_string
   */
  union: A.union(A.string(), A.null()).default("some_string").doc('some union field'),
  /**
   * @avro-doc some's union field's
   */
  fixed: A.fixed(10).logicalType<number>('decimal', { precision: 10, scale: 10 }).doc('some\\'s union field\\'s'),
  /**
   * @avro-doc some union field
   */
  map: A.map(A.string()).doc('some union field'),
  enum: A.enum('some', 'any').default("some")
})

export default NameFromCommentTag
`
    )
  })

  it('fails if avro schema not valid', () => {
    expect(() => avscToDefinerCode({} as any)).toThrowError()
  })

  it('works if no comments provided', () => {
    expect(getRenderer()(`
      {
        "type": "record",
        "fields": [
          { "name": "field", "type": { "type": "string" } }
        ]
      }
    `)).toEqual(`import A from 'avroschema-definer'

const Schema = A.record({
  field: A.string()
})

export default Schema
`)
  })
})
