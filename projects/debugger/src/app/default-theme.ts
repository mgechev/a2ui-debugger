import { Types } from '@a2ui/lit/0.8';

export const DEFAULT_THEME: Types.Theme = {
    components: {
        AudioPlayer: {},
        Button: {},
        Card: {},
        Column: {},
        CheckBox: { container: {}, element: {}, label: {} },
        DateTimeInput: { container: {}, element: {}, label: {} },
        Divider: {},
        Image: { all: {}, icon: {}, avatar: {}, smallFeature: {}, mediumFeature: {}, largeFeature: {}, header: {} },
        Icon: {},
        List: {},
        Modal: { backdrop: {}, element: {} },
        MultipleChoice: { container: {}, element: {}, label: {} },
        Row: {},
        Slider: { container: {}, element: {}, label: {} },
        Tabs: { container: {}, element: {}, controls: { all: {}, selected: {} } },
        Text: {
            all: {},
            h1: {}, h2: {}, h3: {}, h4: {}, h5: {},
            caption: {}, body: {} // Note: h6 missing in interface? types.ts line 125 doesn't list h6, but line 164 does? 
            // types.ts line 116 struct: h1..h5, caption, body.
        },
        TextField: { container: {}, element: {}, label: {} },
        Video: {},
    },
    elements: {
        a: {}, audio: {}, body: {}, button: {}, h1: {}, h2: {}, h3: {}, h4: {}, h5: {},
        iframe: {}, input: {}, p: {}, pre: {}, textarea: {}, video: {}
    },
    markdown: {
        p: [], h1: [], h2: [], h3: [], h4: [], h5: [],
        ul: [], ol: [], li: [], a: [], strong: [], em: []
    },
    additionalStyles: {}
} as unknown as Types.Theme;
