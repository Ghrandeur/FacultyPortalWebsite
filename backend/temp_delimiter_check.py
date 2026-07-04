from pathlib import Path
text = Path('../assets/js/admin-dashboard.js').read_text(encoding='utf-8')
brace = paren = bracket = 0
open_string = None
escaped = False
line = 1
for ch in text:
    if ch == '\n':
        line += 1
        escaped = False
        continue
    if open_string:
        if escaped:
            escaped = False
        elif ch == '\\':
            escaped = True
        elif ch == open_string:
            open_string = None
        continue
    if ch in ('"', "'", '`'):
        open_string = ch
        continue
    if ch == '{':
        brace += 1
    elif ch == '}':
        brace -= 1
    elif ch == '(':
        paren += 1
    elif ch == ')':
        paren -= 1
    elif ch == '[':
        bracket += 1
    elif ch == ']':
        bracket -= 1
    if brace < 0 or paren < 0 or bracket < 0:
        print('negative', ch, 'line', line, 'brace', brace, 'paren', paren, 'bracket', bracket)
        break
else:
    print('final', 'brace', brace, 'paren', paren, 'bracket', bracket, 'open', open_string)
