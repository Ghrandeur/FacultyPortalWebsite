from pathlib import Path
text = Path('../assets/js/admin-dashboard.js').read_text(encoding='utf-8')
stack=[]
open_string=None
escaped=False
line=1
for i,ch in enumerate(text):
    if ch=='\n':
        line += 1
        escaped=False
        continue
    if open_string:
        if escaped:
            escaped=False
        elif ch=='\\':
            escaped=True
        elif ch==open_string:
            open_string=None
        continue
    if ch in ('"', "'", '`'):
        open_string=ch
        continue
    if ch in '{([':
        stack.append((ch, line, i))
    elif ch in '})]':
        if not stack:
            print('unmatched closing', ch, 'line', line)
            break
        o,l,pos = stack.pop()
        if o=='{' and ch!='}':
            print('mismatch', o, ch, l, line)
            break
        if o=='(' and ch!=')':
            print('mismatch', o, ch, l, line)
            break
        if o=='[' and ch!=']':
            print('mismatch', o, ch, l, line)
            break
else:
    if stack:
        print('remaining count', len(stack))
        for item in stack[-5:]:
            print('open', item)
    else:
        print('balanced')
