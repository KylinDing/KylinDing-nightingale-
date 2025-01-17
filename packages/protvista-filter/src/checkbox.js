import { html, render } from "lit-html";

import "./style.css";

class ProtvistaCheckbox extends HTMLElement {
  static get tagName() {
    return "protvista-checkbox";
  }

  constructor() {
    super();
    this._toggleChecked = this._toggleChecked.bind(this);
  }

  connectedCallback() {
    this._render();
  }

  static get observedAttributes() {
    return ["checked", "disabled", "value"];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    switch (name) {
      case "checked":
        this.checked = true;
        break;
      case "disabled":
        this.disabled = true;
        break;
      case "value":
        this.value = newValue;
    }
  }

  _render() {
    let {
      value,
      options: { labels, colors },
      checked = false,
      disabled = false
    } = this;
    if (colors.length == null) {
      colors = [colors];
    }
    value = `filter-${value.split(":")[1]}`;
    const cssId = value.replace(/[\s,\(\)']/g, "");
    const isCompound = colors.length > 1;
    render(
      html`
        <style>
          #${cssId}
            .protvista_checkbox_input
            + .protvista_checkbox_label::before {
            background: ${isCompound
              ? html`
                  linear-gradient(${colors[0]}, ${colors[1]})
                `
              : colors[0]};
            opacity: 0.4;
          }

          #${cssId}
            .protvista_checkbox_input:checked
            + .protvista_checkbox_label::before {
            opacity: 1;
          }
        </style>
        <label
          id="${cssId}"
          class="protvista_checkbox ${isCompound ? "compound" : ""}"
          tabindex="0"
        >
          <input
            type="checkbox"
            class="protvista_checkbox_input"
            ?checked="${checked}"
            ?disabled="${disabled}"
            .value="${value}"
            @change="${this._toggleChecked}"
          />
          <span class="protvista_checkbox_label">
            ${labels.map(
              l =>
                html`
                  <span>${l}</span>
                `
            )}
          </span>
        </label>
      `,
      this
    );
  }

  _toggleChecked(event) {
    event.stopPropagation();
    this.checked = !this.checked;
    this._fireEvent();
    this._render();
  }

  _fireEvent() {
    this.dispatchEvent(
      new CustomEvent("filterChange", {
        bubbles: true,
        composed: true,
        detail: {
          checked: this.checked,
          value: this.value
        }
      })
    );
  }
}

customElements.define(ProtvistaCheckbox.tagName, ProtvistaCheckbox);
