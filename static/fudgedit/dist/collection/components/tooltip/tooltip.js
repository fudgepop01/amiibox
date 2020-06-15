import { Component, Prop, h } from "@stencil/core";
export class Tooltip {
    constructor() {
        this.active = false;
    }
    render() {
        if (!this.active)
            return;
        const out = [];
        if (this.data) {
            let data = (typeof this.data === 'string') ? JSON.parse(this.data) : this.data;
            if (data.name)
                out.push(h("span", null, `name: ${data.name}`), h("br", null));
            out.push(h("span", null, `size: ${data.end - data.start} [0x${data.start.toString(16)} - 0x${data.end.toString(16)}]`), h("br", null));
            for (const [key, value] of Object.entries(data)) {
                if (['name', 'subRegions', 'start', 'end'].includes(key))
                    continue;
                if (value !== null) {
                    out.push(h("span", null,
                        key,
                        ": ",
                        value), h("br", null));
                }
            }
        }
        else if (this.simpleText) {
            out.push(h("span", null, this.simpleText));
        }
        else {
            out.push(h("span", null, "placeholder"));
        }
        return out;
    }
    static get is() { return "fudge-hex-tooltip"; }
    static get originalStyleUrls() { return {
        "$": ["tooltip.css"]
    }; }
    static get styleUrls() { return {
        "$": ["tooltip.css"]
    }; }
    static get properties() { return {
        "active": {
            "type": "boolean",
            "mutable": false,
            "complexType": {
                "original": "boolean",
                "resolved": "boolean",
                "references": {}
            },
            "required": false,
            "optional": false,
            "docs": {
                "tags": [],
                "text": ""
            },
            "attribute": "active",
            "reflect": false,
            "defaultValue": "false"
        },
        "data": {
            "type": "string",
            "mutable": false,
            "complexType": {
                "original": "{[key: string]: string} | string",
                "resolved": "string | { [key: string]: string; }",
                "references": {}
            },
            "required": false,
            "optional": false,
            "docs": {
                "tags": [],
                "text": ""
            },
            "attribute": "complex",
            "reflect": false
        },
        "simpleText": {
            "type": "string",
            "mutable": false,
            "complexType": {
                "original": "string",
                "resolved": "string",
                "references": {}
            },
            "required": false,
            "optional": false,
            "docs": {
                "tags": [],
                "text": ""
            },
            "attribute": "simple",
            "reflect": false
        }
    }; }
}
