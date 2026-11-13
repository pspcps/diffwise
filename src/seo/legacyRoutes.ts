import type { ViewMode } from "../types";
export const HASH_TO_MODE: Record<string, ViewMode> = {
  "#/text": "text",
  "#/diff": "text",
  "#/diff-checker": "text",
  "#/code-compare": "text",
  "#/text-diff": "text",

  "#/file": "file",
  "#/file-diff": "file",
  "#/folder-diff": "file",

  "#/case": "case",
  "#/case-converter": "case",

  "#/json": "json",
  "#/json-converter": "json",
  "#/json-to-table": "json",
  "#/json-formatter": "json",
  "#/json-validator": "json",

  "#/time": "time",
  "#/timezone": "time",
  "#/timezone-converter": "time",
  "#/epoch-converter": "time",

  "#/base64": "base64",
  "#/base64-converter": "base64",
  "#/image-to-base64": "base64",

  "#/markup": "markup",
  "#/html-sandbox": "markup",
  "#/sql-formatter": "markup",
  "#/xml-formatter": "markup",

  "#/regex": "regex",
  "#/regex-tester": "regex",
  "#/regex-debugger": "regex",

  "#/url": "url",
  "#/url-encoder": "url",
  "#/url-decoder": "url",

  "#/architecture": "architecture",
  "#/database-diagram": "architecture",
  "#/architecture-diagram": "architecture",
  "#/erd-designer": "architecture",

  "#/pdf": "pdf",
  "#/word-to-pdf": "pdf",
  "#/docx-to-pdf": "pdf",
  "#/pdf-converter": "pdf",

  "#/image_studio": "image_studio",
  "#/image": "image_studio",
  "#/image-studio": "image_studio",
  "#/image-crop": "image_studio",
  "#/image-compressor": "image_studio",

  "#/har": "har",
  "#/har-viewer": "har",
  "#/har-file-viewer": "har",
  "#/network-inspector": "har",

  "#/jwt": "jwt",
  "#/jwt-debugger": "jwt",
  "#/jwt-parser": "jwt",
  "#/jwt-token": "jwt",

  "#/yaml": "json",
  "#/yaml-converter": "json",
  "#/yaml-to-json": "json",
  "#/json-to-yaml": "json",

  "#/uuid": "uuid",
  "#/uuid-generator": "uuid",
  "#/snowflake": "uuid",
  "#/snowflake-generator": "uuid",
  "#/ulid": "uuid",
  "#/nanoid": "uuid",

  "#/api": "api",
  "#/apidesk": "api",
  "#/postman": "api",
  "#/swagger": "api",
  "#/openapi": "api",
  "#/graphql": "api",

  "#/debug": "debug",
  "#/debugflow": "debug",
  "#/error-debugger": "debug",
  "#/stacktrace": "debug",
  "#/logs": "debug",

  "#/measure": "measure",
  "#/units": "measure",
  "#/unit-converter": "measure",
  "#/geometry": "measure",
  "#/distance": "distance",
  "#/geodistance": "distance",
  "#/geo-distance": "distance",
  "#/coordinates": "distance",
  "#/lat-lon": "distance",
  "#/latlon": "distance",
  "#/haversine": "distance",
};
