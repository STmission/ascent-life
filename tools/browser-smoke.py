import time

def click_action(action, index=0):
    r = js(f"(()=>{{let b=[...document.querySelectorAll('[data-act=\"{action}\"]')].filter(b=>!b.disabled)[{index}];if(!b)return null;let r=b.getBoundingClientRect();return {{x:r.x+r.width/2,y:r.y+r.height/2}}}})()")
    if not r: return False
    js(f"[...document.querySelectorAll('[data-act=\"{action}\"]')].filter(b=>!b.disabled)[{index}].click()")
    time.sleep(0.25)
    return True

for step in range(30):
    actions = js("[...document.querySelectorAll('[data-act]')].filter(b=>!b.disabled && b.getBoundingClientRect().width>0).map(b=>b.dataset.act)")
    if 'option' in actions:
        if js("!!document.querySelector('[data-key=skills]')"):
            click_action('option', 0)
            click_action('option', 1)
        else: click_action('option')
        if not click_action('next'): raise Exception('Creation cannot advance')
    elif 'confirm' in actions: click_action('confirm')
    elif 'enter' in actions:
        click_action('enter')
        time.sleep(0.8)
    elif 'close-result' in actions: click_action('close-result')
    elif 'pick' in actions: click_action('pick')
    elif 'advance' in actions:
        click_action('advance')
        time.sleep(0.8)
    elif 'again' in actions:
        print('PASS: death epitaph reached')
        break
    else:
        print('Stopped: '+str(actions))
        break
print(js('document.body.innerText.slice(0,1800)'))
