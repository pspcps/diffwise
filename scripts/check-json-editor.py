"""Browser regression: run a dev server, then `python scripts/check-json-editor.py`.
Requires Python Playwright and Chromium. Optional arguments: base URL, Chromium path.
Uses the installed Monaco files instead of relying on the CDN during this test.
"""
from pathlib import Path
import json
import sys
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:3000'
BINARY = sys.argv[2] if len(sys.argv) > 2 else '/usr/bin/chromium'
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=BINARY, headless=True, args=['--no-sandbox'])
    context = browser.new_context(viewport={'width': 1440, 'height': 1000}, permissions=['clipboard-read', 'clipboard-write'])
    page = context.new_page()
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    def local_monaco(route):
        if '/monaco-editor@' in route.request.url and '/min/vs/' in route.request.url:
            asset = route.request.url.split('/min/vs/', 1)[1].split('?', 1)[0]
            route.fulfill(path=str(ROOT / 'node_modules/monaco-editor/min/vs' / asset), headers={'Access-Control-Allow-Origin': '*'})
        else:
            route.continue_()
    page.route('**/*', local_monaco)
    page.goto(BASE + '/tools/json-formatter/')
    page.wait_for_selector('.structured-editor .monaco-editor')
    page.evaluate('window.ed = monaco.editor.getEditors().find(e => e.getDomNode()?.closest(".structured-editor"))')
    def paste(value):
        page.evaluate('(text) => { ed.focus(); ed.setSelection(ed.getModel().getFullModelRange()); return navigator.clipboard.writeText(text); }', value)
        page.keyboard.press('Control+V')
        page.wait_for_timeout(700)
    def hidden():
        # Monaco's view model exposes the actual hidden source-line ranges.
        return page.evaluate('ed._getViewModel().getHiddenAreas().map(r => [r.startLineNumber, r.endLineNumber])')
    def settle():
        page.wait_for_timeout(150)
    paste(json.dumps({'child': {'nested': {'hello': 'world'}, 'other': 5}, 'sibling': [1, 2, 3]}, indent=2))
    page.wait_for_selector('.codicon-folding-expanded')
    original = page.evaluate('ed.getValue()')
    assert not page.locator('.structured-editor').evaluate('(e) => !!e.closest("label")')
    assert page.locator('.structured-editor .fold-controls button').count() == 2
    for _ in range(3):
        page.locator('.codicon-folding-expanded').nth(1).click()
        settle()
        assert hidden() == [[3, 6]], hidden()  # Only child, not root or sibling.
        page.locator('.codicon-folding-collapsed').first.click()
        settle()
        assert hidden() == [], hidden()
    page.locator('.codicon-folding-expanded').first.click()
    settle()
    assert hidden() == [[2, 12]]
    page.locator('.codicon-folding-collapsed').first.click()
    settle()
    assert hidden() == []
    page.locator('.codicon-folding-expanded').nth(1).click()
    page.locator('.inline-folded').first.click()
    settle()
    assert hidden() == []
    for _ in range(2):
        page.get_by_role('button', name='Collapse all json', exact=True).click()
        settle()
        assert hidden()
        page.get_by_role('button', name='Expand all json', exact=True).click()
        settle()
        assert hidden() == []
    assert page.evaluate('ed.getValue()') == original
    body = {'items': [{'address': {'city': 'Las Vegas'}, 'access': [{'lat': 36.17, 'lng': -115.05}]}]}
    wrapped = {'coord_id': 'IDL|014878', 'body': json.dumps(body), 'status': 200}
    paste(json.dumps(wrapped))
    result = json.loads(page.evaluate('ed.getValue()'))
    assert result['body'] == body, result
    assert 'decoded 1 nested JSON string' in page.locator('body').inner_text()
    # Both panes receive the same structured value; nested body is expandable.
    assert 'Object · 1 property' in page.locator('body').inner_text()
    page.get_by_label('Decode nested JSON strings', exact=True).uncheck()
    paste(json.dumps(wrapped))
    assert isinstance(json.loads(page.evaluate('ed.getValue()'))['body'], str)
    page.get_by_label('Decode nested JSON strings', exact=True).check()
    settle()
    assert json.loads(page.evaluate('ed.getValue()'))['body'] == body
    paste('{child: {nested: [1,2,],}, other: true}')
    assert json.loads(page.evaluate('ed.getValue()')) == {'child': {'nested': [1, 2]}, 'other': True}
    page.get_by_role('button', name='Collapse all json', exact=True).click()
    settle()
    page.get_by_role('button', name='Expand all json', exact=True).click()
    settle()
    assert hidden() == []
    assert not errors, errors
    print('PASS child/root arrows, ellipsis reopening, repeated expand/collapse, unchanged source, nested body paste decoding and opt-out.')
    browser.close()
