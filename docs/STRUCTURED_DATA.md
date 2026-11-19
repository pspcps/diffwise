# JSON Studio live conversion

JSON Studio accepts JSON, XML and YAML pastes without a separate parse/convert click. Pasting XML or YAML into the main JSON editor opens the matching conversion view automatically; in a conversion view, editing either side updates the other when input is valid. Unrecoverable input stays editable, with an error and the last valid counterpart retained. Clearing an active input clears its counterpart.

## Environment objects

ENV and nested JSON both use syntax-colored editors. **Merge parent names (ignore case)** defaults on:

```dotenv
Secret__PASSWORDLESS_TOKEN_CLIENT_SECRET=example-one
SECRET__MSK_SASL_BROKERS=example-two
```

becomes one `Secret` object containing both child keys. Mixed-case spelling such as `Secret` is preferred over `SECRET`, independent of line order. Turn grouping off to preserve distinct parent names. Leaf names remain case-sensitive. If enabled, `__` and `.` nesting work together. Exact repeated leaf keys use the last value; object-valued assignments merge their children when type parsing is enabled. A scalar/object path collision is reported instead of silently dropping a value.

**Parse types** stays optional. Without it, ENV values remain strings. With it, unquoted JSON numbers, booleans, null, arrays and objects can become typed values; quoted values remain strings. JSON-to-ENV output quotes strings where needed. Inputs are processed in the browser; no conversion service or input upload is added.

## Sorting and inspection

**Sort keys A–Z** defaults on and can be disabled. Pasted source and generated results sort nested keys; typing updates the opposite pane without repeatedly rewriting the active input/cursor. Arrays keep their element order. ENV comments remain attached to their assignment lines, and equal/aliased key paths retain override order. YAML source sorting retains document comments. XML sorting preserves repeated-tag order and leaves mixed text/element content alone; XML attributes, namespace and conversion conventions follow the existing JSON/XML mapper.

The ENV result offers **Code** and **Tree & copy values**. Code has gutter folding, cursor-based Fold object/Unfold object, and explicit Fold all/Unfold all. The tree has independent object/array toggles, expand/collapse-result actions, array lengths and copy icons on each node. Strings copy as raw values; other values copy as JSON. Clipboard failure is reported next to that node.

## Verification

- `npm run test:structured` exercises casing/grouping, nesting, duplicate keys, path collisions, quoted/types, safe special keys, source sorting, array order and YAML validation.
- Browser checks cover real clipboard paste, automatic cross-format conversion, invalid-input recovery, syntax token colors, fold/unfold recovery, individual object folding, tree copy, sort/grouping preferences and tool switching.

Structured editors use indentation-based folding and disable asynchronous symbol occurrence highlighting, avoiding canceled background requests when a conversion changes the active editor.

## Automatic JSON repair

**Repair JSON automatically** defaults on. The local `jsonrepair` parser recovers common syntax mistakes such as single/unquoted keys, trailing or missing commas, comments and missing closing brackets. Repaired input carries an explicit warning: inferred values and structure must be reviewed. Syntax recovery is not semantic validation and cannot determine the author’s intended values. Turn the option off for strict JSON parsing.

Pasted recoverable JSON is formatted automatically, including in the ENV result pane. Typed incomplete input remains untouched while JSON trees, tables, graphs and the opposite conversion pane use a repaired preview. **Apply repaired JSON to editor** formats that preview for code folding. This distinction keeps the cursor and original input available while editing. Copy JSON copies the repaired preview when repair is active; review the warning before using it. Each object/array keeps its own tree toggle while editing; changing text no longer resets all expanded nodes. Code folding works on the formatted result, with individual and global fold/unfold controls. Unrecoverable JSON is retained and reports an error. Automatic repair is capped at 2 MB; no repair service or input upload is used.
