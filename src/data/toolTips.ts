import type { ViewMode } from "../types";
export const TOOL_TIPS: Record<ViewMode, string> = {
  text: "Try an example loads two JSON documents. Edit either side, then compare to inspect added and removed lines.",
  file: "Choose files or folders from both versions. Select a changed file to inspect its differences.",
  json: "Paste JSON for colored keys and values. Tree reveals nested properties; Table helps compare records; Graph shows relationships.",
  api: "Build a request using its method, URL, headers, and body. Sending it contacts that endpoint, so use test credentials and check the destination.",
  architecture:
    "Start with a system or database diagram. Connect related nodes, or use Mermaid when you prefer writing diagrams as code.",
  regex:
    "Enter a pattern and test text. Inspect highlighted matches and capture groups, and try the presets to get started.",
  pdf: "Choose the operation first, then add your documents. Check page order and ranges before downloading the result.",
  har: "Load an HTTP Archive from your browser. Inspect request timing, headers, and response content to investigate slow calls.",
  jwt: "Paste a token to inspect its header and claims. Decoding a token does not prove its signature is valid.",
  uuid: "Choose an identifier format and how many you need. Time-ordered formats can be useful when sorting records.",
  image_studio:
    "Add an image, then crop, resize, or adjust compression. Review dimensions and quality before downloading.",
  time: "Convert a Unix timestamp or compare time zones. Check whether your timestamp uses seconds or milliseconds.",
  base64:
    "Encode an image into a data URL or decode an existing Base64 image. Large data URLs can make source files bulky.",
  markup:
    "Choose the language you are working with. Format markup or SQL, or inspect the HTML sandbox preview.",
  case: "Type or paste your text, then choose a writing or identifier style. The converted result updates immediately.",
  debug:
    "Paste an error or stack trace and select the relevant format. Review the parsed frames and root-cause clues.",
  distance:
    "Enter the latitude and longitude of both points. Check coordinate signs before comparing the calculated distances.",
  url: "Encode or decode a URL, or inspect its query parameters. Keep an eye on reserved characters when sharing links.",
};
