import { select, event as d3Event } from "d3";
import _includes from "lodash-es/includes";
import FeatureShape from "./FeatureShape";
import NonOverlappingLayout from "./NonOverlappingLayout";
import DefaultLayout from "./DefaultLayout";
import ProtvistaZoomable from "protvista-zoomable";
import { config } from "./config";
import ConfigHelper from "./ConfigHelper";

class ProtvistaTrack extends ProtvistaZoomable {
  getLayout(data) {
    if (String(this.getAttribute("layout")).toLowerCase() === "non-overlapping")
      return new NonOverlappingLayout({
        layoutHeight: this._height
      });
    return new DefaultLayout({
      layoutHeight: this._height
    });
  }

  connectedCallback() {
    super.connectedCallback();
    this._color = this.getAttribute("color");
    this._shape = this.getAttribute("shape");
    this._featureShape = new FeatureShape();
    this._layoutObj = this.getLayout();
    this._config = new ConfigHelper(config);

    if (this._data) this._createTrack();

    this.addEventListener("load", e => {
      if (_includes(this.children, e.target)) {
        this.data = e.detail.payload;
      }
    });
  }

  normalizeLocations(data) {
    return data.map(obj => {
      const { locations, start, end } = obj;
      return locations
        ? obj
        : Object.assign(obj, {
            locations: [
              {
                fragments: [
                  {
                    start,
                    end
                  }
                ]
              }
            ]
          });
    });
  }

  set data(data) {
    this._data = this.normalizeLocations(data);
    this._createTrack();
  }

  static get observedAttributes() {
    return ProtvistaZoomable.observedAttributes.concat([
      "highlight",
      "color",
      "shape"
    ]);
  }

  _getFeatureColor(f) {
    if (f.color) {
      return f.color;
    } else if (this._color) {
      return this._color;
    } else if (f.type) {
      return this._config.getColorByType(f.type);
    } else {
      return "black";
    }
  }

  _getShape(f) {
    if (f.shape) {
      return f.shape;
    } else if (this._shape) {
      return this._shape;
    } else if (f.type) {
      return this._config.getShapeByType(f.type);
    } else {
      return "rectangle";
    }
  }

  _createTrack() {
    this._layoutObj.init(this._data);

    select(this)
      .selectAll("svg")
      .remove();

    this.svg = select(this)
      .append("div")
      .style("line-height", 0)
      .append("svg")
      .attr("width", this.width)
      .attr("height", this._height);

    this.trackHighlighter.appendHighlightTo(this.svg);

    this.seq_g = this.svg
      .append("g")
      .attr("class", "sequence-features")
      .attr("transform", "translate(0 ," + this.margin.top + ")");

    this._createFeatures();
  }

  _createFeatures() {
    this.featuresG = this.seq_g.selectAll("g.feature-group").data(this._data);

    this.locations = this.featuresG
      .enter()
      .append("g")
      .attr("class", "feature-group")
      .attr("id", d => `g_${d.accession}`)
      .selectAll("g.location-group")
      .data(d =>
        d.locations.map(loc =>
          Object.assign({}, loc, {
            feature: d
          })
        )
      )
      .enter()
      .append("g")
      .attr("class", "location-group");

    this.features = this.locations
      .selectAll("g.fragment-group")
      .data(d =>
        d.fragments.map(loc =>
          Object.assign({}, loc, {
            feature: d.feature
          })
        )
      )
      .enter()
      .append("path")
      .attr("class", "feature")
      .attr("d", f =>
        this._featureShape.getFeatureShape(
          this.getSingleBaseWidth(),
          this._layoutObj.getFeatureHeight(f),
          f.end ? f.end - f.start + 1 : 1,
          this._getShape(f.feature)
        )
      )
      .attr(
        "transform",
        f =>
          "translate(" +
          this.getXFromSeqPosition(f.start) +
          "," +
          (this.margin.top + this._layoutObj.getFeatureYPos(f.feature)) +
          ")"
      )
      .attr("fill", f => this._getFeatureColor(f.feature))
      .attr("stroke", f => this._getFeatureColor(f.feature))
      .call(this.bindEvents, this);
  }

  refresh() {
    if (this.xScale && this.seq_g) {
      this.features = this.seq_g.selectAll("path.feature").data(
        this._data.reduce(
          (acc, f) =>
            acc.concat(
              f.locations.reduce(
                (acc2, e) =>
                  acc2.concat(
                    e.fragments.map(loc =>
                      Object.assign({}, loc, {
                        feature: f
                      })
                    )
                  ),
                []
              )
            ),
          []
        )
      );
      this.features
        .attr("d", f =>
          this._featureShape.getFeatureShape(
            this.getSingleBaseWidth(),
            this._layoutObj.getFeatureHeight(f),
            f.end ? f.end - f.start + 1 : 1,
            this._getShape(f.feature)
          )
        )
        .attr(
          "transform",
          f =>
            "translate(" +
            this.getXFromSeqPosition(f.start) +
            "," +
            (this.margin.top + this._layoutObj.getFeatureYPos(f.feature)) +
            ")"
        );
      this._updateHighlight();
    }
  }
  _updateHighlight() {
    this.trackHighlighter.updateHighlight();
  }
}

export default ProtvistaTrack;
