const http = require('http');

const PORT = 8000;

const server = http.createServer((req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    if (req.url === '/stream') {
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        });

        console.log('Client connected');

        const sendEvent = (data) => {
            res.write(`data: ${JSON.stringify(data)}\n\n`);
        };

        // Simulate an app startup sequence
        let step = 0;
        const interval = setInterval(() => {
            if (step === 0) {
                sendEvent({
                    beginRendering: {
                        surfaceId: 'main',
                        root: 'root-card',
                        styles: {
                            font: 'Inter, sans-serif',
                            primaryColor: '#3498db',
                        },
                    },
                });
            } else if (step === 1) {
                sendEvent({
                    surfaceUpdate: {
                        surfaceId: 'main',
                        components: [
                            {
                                id: 'root-card',
                                component: {
                                    Card: {
                                        child: 'col-1',
                                    },
                                },
                            },
                            {
                                id: 'col-1',
                                component: {
                                    Column: {
                                        children: {
                                            explicitList: ['header-text', 'body-text', 'action-row'],
                                        },
                                    },
                                },
                            },
                            {
                                id: 'header-text',
                                component: {
                                    Text: {
                                        text: { literalString: 'Hello SSE World!' },
                                        usageHint: 'h1',
                                    },
                                },
                            },
                            {
                                id: 'body-text',
                                component: {
                                    Text: {
                                        text: { literalString: 'This content is streaming from a Node.js server.' },
                                        usageHint: 'body',
                                    },
                                },
                            },
                            {
                                id: 'action-row',
                                component: {
                                    Row: {
                                        children: {
                                            explicitList: ['btn-1', 'btn-2'],
                                        },
                                    },
                                },
                            },
                            {
                                id: 'btn-1',
                                component: {
                                    Button: {
                                        child: 'btn-1-txt',
                                        action: { name: 'approve', context: [] },
                                    },
                                },
                            },
                            {
                                id: 'btn-1-txt',
                                component: {
                                    Text: { text: { literalString: 'Approve' }, usageHint: 'body' },
                                },
                            },
                            {
                                id: 'btn-2',
                                component: {
                                    Button: {
                                        child: 'btn-2-txt',
                                        action: { name: 'reject', context: [] },
                                    },
                                },
                            },
                            {
                                id: 'btn-2-txt',
                                component: {
                                    Text: { text: { literalString: 'Reject' }, usageHint: 'body' },
                                },
                            },
                        ],
                    },
                });
            } else if (step === 2) {
                // Update text dynamically
                sendEvent({
                    surfaceUpdate: {
                        surfaceId: 'main',
                        components: [
                            {
                                id: 'body-text',
                                component: {
                                    Text: {
                                        text: { literalString: `Updated at ${new Date().toLocaleTimeString()}` },
                                        usageHint: 'body'
                                    }
                                }
                            }
                        ]
                    }
                });
                // Reset to repeat the dynamic update
                step = 1;
            }
            step++;
        }, 2000);

        req.on('close', () => {
            console.log('Client disconnected');
            clearInterval(interval);
            res.end();
        });
    } else {
        res.writeHead(404);
        res.end('Not Found');
    }
});

server.listen(PORT, () => {
    console.log(`SSE Server running at http://localhost:${PORT}/stream`);
});
