fudgeapps.loadBundle('fudge-hex-tooltip', ['exports'], function (exports) {
    var h = window.fudgeapps.h;
    var Tooltip = /** @class */ (function () {
        function Tooltip() {
            this.active = false;
        }
        Tooltip.prototype.render = function () {
            if (!this.active)
                return;
            var out = [];
            if (this.data) {
                var data = (typeof this.data === 'string') ? JSON.parse(this.data) : this.data;
                if (data.name)
                    out.push(h("span", null, "name: " + data.name), h("br", null));
                out.push(h("span", null, "size: " + (data.end - data.start) + " [0x" + data.start.toString(16) + " - 0x" + data.end.toString(16) + "]"), h("br", null));
                for (var _i = 0, _a = Object.entries(data); _i < _a.length; _i++) {
                    var _b = _a[_i], key = _b[0], value = _b[1];
                    if (['name', 'subRegions', 'start', 'end'].includes(key))
                        continue;
                    if (value !== null) {
                        out.push(h("span", null, key, ": ", value), h("br", null));
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
        };
        Object.defineProperty(Tooltip, "is", {
            get: function () { return "fudge-hex-tooltip"; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Tooltip, "properties", {
            get: function () {
                return {
                    "active": {
                        "type": Boolean,
                        "attr": "active"
                    },
                    "data": {
                        "type": String,
                        "attr": "complex"
                    },
                    "simpleText": {
                        "type": String,
                        "attr": "simple"
                    }
                };
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Tooltip, "style", {
            get: function () { return "fudge-hex-tooltip {\n  position: fixed;\n  display: none;\n\n  -webkit-box-sizing: border-box;\n\n  box-sizing: border-box;\n  font-size: 14px;\n  max-width: 400px;\n  padding: 5px;\n  border-radius: 2px;\n\n  background-color: #000;\n  color: white;\n\n  z-index: 1000;\n  pointer-events: none;\n}\n\nfudge-hex-tooltip[active=true] {\n  display: block;\n  left: calc(var(--mouse-x) * 1px);\n  top: calc(var(--mouse-y) * 1px);\n  -webkit-transition: .2s left ease, .2s top ease;\n  transition: .2s left ease, .2s top ease;\n}"; },
            enumerable: true,
            configurable: true
        });
        return Tooltip;
    }());
    exports.FudgeHexTooltip = Tooltip;
    Object.defineProperty(exports, '__esModule', { value: true });
});
