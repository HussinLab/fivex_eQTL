/**
 * Utility functions and data sources used by LocusZoom
 *
 * Note: Data sources are registered as a side effect the first time the module is imported
 *
 * It can be useful to define these in a single central file, so that changes to the display layer
 *  don't cause these things to be re-registered when the page reloads
 */
import LocusZoom from 'locuszoom';

/**
 * Helper method that fetches a desired field value regardless of namespacing
 * @param {object} point_data
 * @param {string} field_suffix
 */
function retrieveBySuffix(point_data, field_suffix) {
  const match = Object.entries(point_data)
    .find((item) => item[0].endsWith(field_suffix));
  return match ? match[1] : null;
}

/**
 * Convert Posterior incl probabilities to a (truncated) log scale for rendering
 */
LocusZoom.TransformationFunctions.set('pip_yvalue', (x) => Math.max(Math.log10(x), -6));

/**
 * Assign point shape based on PIP cluster designation. Since there are always just a few clusters, and cluster 1
 *  is most significant, this hard-coding is a workable approach.
 */
LocusZoom.ScaleFunctions.add('pip_cluster', (parameters, input) => {
  if (typeof input !== 'undefined') {
    const pip_cluster = retrieveBySuffix(input, ':pip_cluster');
    if (pip_cluster === 1) {
      return 'cross';
    }
    if (pip_cluster === 2) {
      return 'square';
    }
    if (pip_cluster === 3) {
      return 'triangle-up';
    }
    if (pip_cluster >= 4) {
      return 'triangle-down';
    }
  }
  return null;
});

/**
 * Assign point shape as arrows based on direction of effect
 */
LocusZoom.ScaleFunctions.add('effect_direction', (parameters, input) => {
  if (typeof input !== 'undefined') {
    const beta = retrieveBySuffix(input, ':beta');
    const stderr_beta = retrieveBySuffix(input, ':stderr_beta');
    if (beta === null || stderr_beta === null) {
      return null;
    }
    if (!Number.isNaN(beta) && !Number.isNaN(stderr_beta)) {
      if (beta - 1.96 * stderr_beta > 0) {
        return parameters['+'] || null;
      } // 1.96*se to find 95% confidence interval
      if (beta + 1.96 * stderr_beta < 0) {
        return parameters['-'] || null;
      }
    }
  }
  return null;
});


// ----------------
// Custom data sources for the variant view
LocusZoom.Data.PheGET = LocusZoom.KnownDataSources.extend('PheWASLZ', 'PheGET', {
  getURL(state, chain) {
    chain.header.maximum_tss_distance = state.maximum_tss_distance;
    chain.header.minimum_tss_distance = state.minimum_tss_distance;
    chain.header.y_field = state.y_field;
    return this.url;
  },
  annotateData(records, chain) {
    // eslint-disable-next-line no-param-reassign
    records = records
      .filter((record) => (record.tss_distance <= chain.header.maximum_tss_distance
        && record.tss_distance >= chain.header.minimum_tss_distance));
    // Add a synthetic field `top_value_rank`, where the best value for a given field gets rank 1.
    // This is used to show labels for only a few points with the strongest (y_field) value.
    // As this is a source designed to power functionality on one specific page, we can hardcode specific behavior
    //   to rank individual fields differently

    // To make it, sort a shallow copy of `records` by `y_field`, and then iterate through the shallow copy, modifying each record object.
    // Because it's a shallow copy, the record objects in the original array are changed too.
    const field = chain.header.y_field;

    function getValue(item) {
      if (field === 'log_pvalue') {
        return item[field];
      } if (field === 'beta') {
        return Math.abs(item[field]);
      } if (field === 'pip') {
        return item[field];
      }
      throw new Error('Unrecognized sort field');
    }

    const shallow_copy = records.slice();
    shallow_copy.sort((a, b) => {
      const av = getValue(a);
      const bv = getValue(b);
      // eslint-disable-next-line no-nested-ternary
      return (av === bv) ? 0 : (av < bv ? 1 : -1); // log: descending order means most significant first
    });
    shallow_copy.forEach((value, index) => {
      value.top_value_rank = index + 1;
    });
    return records;
  },
});

/**
 * A special modified datalayer, which sorts points in a unique way (descending), and allows tick marks to be defined
 *   separate from how things are grouped. Eg, we can sort by tss_distance, but label by gene name
 */
LocusZoom.DataLayers.extend('category_scatter', 'category_scatter', {
  // Redefine the layout, in order to preserve CSS rules (which incorporate the name of the layer)
  _prepareData() {
    const xField = this.layout.x_axis.field || 'x';
    // The (namespaced) field from `this.data` that will be used to assign datapoints to a given category & color
    const { category_field } = this.layout.x_axis;
    if (!category_field) {
      throw new Error(`Layout for ${this.layout.id} must specify category_field`);
    }

    // Element labels don't have to match the sorting field used to create groups. However, we enforce a rule that
    //  there must be a 1:1 correspondence
    // If two points have the same value of `category_field`, they MUST have the same value of `category_label_field`.
    let sourceData;
    const { category_order_field } = this.layout.x_axis;
    if (category_order_field) {
      const unique_categories = {};
      // Requirement: there is (approximately) a 1:1 correspondence between categories and their associated labels
      this.data.forEach((d) => {
        const item_cat_label = d[category_field];
        const item_cat_order = d[category_order_field];
        // In practice, we find that some gene symbols are ambiguous (appear at multiple positions), and close
        //  enough Example: "RF00003". Hence, we will build the uniqueness check on TSS, not gene symbol (and
        //  hope that TSS is more unique than gene name)
        // TODO: If TSS can ever be ambiguous, we have traded one "not unique" bug for another. Check closely.
        if (!Object.prototype.hasOwnProperty.call(unique_categories, item_cat_label)) {
          unique_categories[item_cat_order] = item_cat_order;
        } else if (unique_categories[item_cat_order] !== item_cat_order) {
          throw new Error(`Unable to sort PheWAS plot categories by ${category_field} because the category ${item_cat_label
          } can have either the value "${unique_categories[item_cat_label]}" or "${item_cat_order}".`);
        }
      });

      // Sort the data so that things in the same category are adjacent
      sourceData = this.data
        .sort((a, b) => {
          const av = -a[category_order_field]; // sort descending
          const bv = -b[category_order_field];
          // eslint-disable-next-line no-nested-ternary
          return (av === bv) ? 0 : (av < bv ? -1 : 1);
        });
    } else {
      // Sort the data so that things in the same category are adjacent (case-insensitive by specified field)
      sourceData = this.data
        .sort((a, b) => {
          const ak = a[category_field];
          const bk = b[category_field];
          const av = ak.toString ? ak.toString().toLowerCase() : ak;
          const bv = bk.toString ? bk.toString().toLowerCase() : bk;
          // eslint-disable-next-line no-nested-ternary
          return (av === bv) ? 0 : (av < bv ? -1 : 1);
        });
    }

    sourceData.forEach((d, i) => {
      // Implementation detail: Scatter plot requires specifying an x-axis value, and most datasources do not
      //   specify plotting positions. If a point is missing this field, fill in a synthetic value.
      d[xField] = d[xField] || i;
    });
    return sourceData;
  },
});


LocusZoom.TransformationFunctions.add('twosigfigs', (x) => {
  if (Math.abs(x) > 0.1) {
    return x.toFixed(2);
  }
  if (Math.abs(x) >= 0.01) {
    return x.toFixed(3);
  }
  return x.toExponential(1);
});


// eslint-disable-next-line import/prefer-default-export
export { retrieveBySuffix };
