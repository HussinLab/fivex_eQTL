<template>
  <div class="container-fluid">
    <div class="row">
      <div class="col-sm-12">
        <h1>Help</h1>
        <br>
        <h2>Expression Quantitative Trait Loci (eQTLs)</h2>
        
        <p>
          In the <b>region view</b>, significant variants which appear to be associated with changes in gene expression are shown in the cis-region around the gene that has been tested, along with the size and direction of their effects.
        </p>

        <p>
          In the <b>single-variant view</b>, associations are summarized across many different studies, tissues, and genes. The ablility to group data according to various categories makes it easy to see if the variant has significant association signals in specific tissues or genes, along with the size and direction of their effects.
        </p>

        <h2>Glossary</h2>
        <dl>
          <dt>Transcription Start Site (TSS) distance</dt>
          <dd>
            The distance (in base pairs, bp) from a given variant to the transcription start site of the specified gene. Often (though not always), variants which signficiantly affect expression levels of a gene are found near the TSS.
          </dd>
        </dl>
      </div>
    </div>
  </div>
</template>

<script>
export default {
    name: 'Help',
};
</script>
