<template>
  <div class="container d-flex min-vh-100">
    <div class="row justify-content-center align-self-center align-items-center">
      <div class="col-12">
        <img src="@/assets/Cartagene_Logos_RVB_Principal_Bicolore_Foncé.6880bd9e.png" alt="Cartagene Logo" class="mx-auto d-block" style="width: 800px; height: auto;"/>
        <h2 class="text-center">
          FIVEx: Visualization for Genotypes, Expressions, and Tissues
        </h2>
        <h5 class="text-center">
          Currently hosting <b>eQTL</b> data from <b>2 different studies</b> : Cartagene and GTEx.
        </h5>
        <search-box />
        <br>
        <div class="text-center">
          Search for: <b>Variant by position:
            <router-link
              :to="{name: 'variant', params: {display_type: 'eqtl', variant: '1_109274968'}}"
            >chr1:109274968</router-link>
            &bull;
            rsID:
            <router-link
              :to="{name: 'variant', params: {display_type: 'eqtl', variant: '1_109274968'}}"
            >rs12740374</router-link>
            <br>
            Region:
            <router-link
              :to="{name: 'region',
                    query: {chrom: '1', start: 108774968, end: 109774968 }}"
            >chr1:108774968-109774968</router-link>
            &bull;
            Gene:
            <router-link
              :to="{name: 'region',
                    query: {chrom: '1', start: 108774968, end: 109774968,
                            study: 'Cartagene', tissue: 'blood',
                            gene_id: 'ENSG00000134243' }}"
            ><i>SORT1</i></router-link></b>
          <br>
          First time?
          <router-link
            :to="{name: 'tutorial'} "
          >
            <b>View the tutorial here</b>
          </router-link>
          to see what FIVEx can do
        </div>
      </div>
    </div>
  </div>
</template>

<script>
// @ is an alias to /src
import SearchBox from '../components/SearchBox.vue';

export default {
    name: 'Home',
    components: { SearchBox },
};
</script>

<style>
  body {
    height: 100%;
  }
</style>
