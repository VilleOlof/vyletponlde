// i have no idea what the FUCK this is doing, but straight up taken from https://porterrobinsle.com/ (by Ottomated)
// IT WORKS, I DONT UNDERSTAND WHY?? and im shamelessly taking this hack from him because what the fuck
// otherwise audio playback doesnt work on safari and shit

function is_ios() {
    return (
        [
            'iPad Simulator',
            'iPhone Simulator',
            'iPod Simulator',
            'iPad',
            'iPhone',
            'iPod',
        ].includes(navigator.platform) ||
        // iPad on iOS 13 detection
        (navigator.userAgent.includes('Mac') && 'ontouchend' in document)
    );
}

export function enableHacks(audio_context: AudioContext) {
    if (!is_ios()) return;
    console.log('You are on iOS :( enabling shitty hacks');

    function noop(): void { }
    let allowPlayback: boolean = true;

    function updatePlaybackState(): void {
        const shouldAllowPlayback: boolean =
            !document.hidden && document.hasFocus() ? true : false;

        if (shouldAllowPlayback !== allowPlayback) {
            allowPlayback = shouldAllowPlayback;

            updateSilence(false);

            updateContextState();
        }
    }

    document.addEventListener('visibilitychange', updatePlaybackState, {
        capture: true,
        passive: true,
    });

    function on_focus(ev: Event) {
        if (ev && ev.target !== window) return;
        updatePlaybackState();
    }

    window.addEventListener('focus', on_focus, {
        capture: true,
        passive: true,
    });
    window.addEventListener('blur', on_focus, {
        capture: true,
        passive: true,
    });

    function updateContextState(): void {
        if (allowPlayback) {
            if (audio_context.state === 'running' || audio_context.state === 'closed')
                return;

            audio_context.resume().catch(noop);
        } else {
            if (audio_context.state !== 'running') return;

            audio_context.suspend().catch(noop);
        }
    }

    audio_context.addEventListener(
        'statechange',
        (ev: Event & { unmute_handled?: boolean }) => {
            if (!ev || !ev.unmute_handled) {
                ev.unmute_handled = true;

                updateContextState();
            }
        },
        {
            capture: true,
            passive: true,
        },
    );
    let silence: HTMLAudioElement | null = null;

    function huffman(count: number, repeatStr: string): string {
        let e: string = repeatStr;
        for (; count > 1; count--) e += repeatStr;
        return e;
    }

    const silenceSrc: string =
        'data:audio/mpeg;base64,//uQx' +
        huffman(23, 'A') +
        'WGluZwAAAA8AAAACAAACcQCA' +
        huffman(16, 'gICA') +
        huffman(66, '/') +
        '8AAABhTEFNRTMuMTAwA8MAAAAAAAAAABQgJAUHQQAB9AAAAnGMHkkI' +
        huffman(320, 'A') +
        '//sQxAADgnABGiAAQBCqgCRMAAgEAH' +
        huffman(15, '/') +
        '7+n/9FTuQsQH//////2NG0jWUGlio5gLQTOtIoeR2WX////X4s9Atb/JRVCbBUpeRUq' +
        huffman(18, '/') +
        '9RUi0f2jn/+xDECgPCjAEQAABN4AAANIAAAAQVTEFNRTMuMTAw' +
        huffman(97, 'V') +
        'Q==';

    function updateSilence(isMediaPlaybackEvent: boolean): void {
        if (!allowPlayback) {
            destroySilenceElement();
            return;
        }
        if (!isMediaPlaybackEvent) return;

        if (!silence) {
            const div = document.createElement('div');
            div.innerHTML = "<audio x-webkit-airplay='deny'></audio>";
            silence = div.firstChild as HTMLAudioElement;
            silence.controls = false;
            silence.disableRemotePlayback = true; // Airplay like controls on other devices, prevents casting of the tag, doesn't work on modern iOS
            silence.preload = 'auto';
            silence.src = silenceSrc;
            silence.loop = true;
            silence.load();
        }

        if (silence.paused) {
            silence.play().catch(destroySilenceElement);
        }
    }

    function destroySilenceElement(): void {
        if (!silence) return;
        silence.src = 'about:blank';
        silence.load();
        silence = null;
    }
    const events = [
        'click',
        'contextmenu',
        'auxclick',
        'dblclick',
        'mousedown',
        'mouseup',
        'touchend',
        'keydown',
        'keyup',
    ];

    for (const event of events) {
        window.addEventListener(
            event,
            () => {
                updateSilence(true);
                updateContextState();
            },
            {
                capture: true,
                passive: true,
            },
        );
    }
}
