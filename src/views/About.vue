<template>
  <div class="container-fluid">
    <div class="row">
      <div class="col-sm-12">
        <h1>About</h1>
        <dt>FIVEx browser</dt>
        <dd>
          <p>
            FIVEx is a tool for browsing expression and splice QTL (cis-eQTL and cis-sQTL) datasets. It provides a number of tools aimed at functional interpretation.
            See the <a href="https://www.biorxiv.org/content/10.1101/2021.01.22.426874v1">preprint</a> for details.
          </p>

          <p>
            Created by Alan Kwong, Mukai Wang, Peter VandeHaar, Andy Boughton, and Hyun Min Kang.
            <a href="https://github.com/statgen/fivex/">Original</a> and <a href="https://github.com/HussinLab/fivex_eQTL">modified</a> source code can be found on GitHub.  
          </p>
        </dd>
      </div>
    </div>
    <dl>
      <dt>Data source and format</dt>
      <dd>
        <p>
          We present RNA-seq data aggregated, harmonized, and analyzed by the <a href="https://gtexportal.org/">GTEx consortium</a> and the Cartagene flagship team.
        </p>
        <p>
          Genome positions use coordinates from human genome build GRCh38. GTEx data represents the V8 release.
        </p>
      </dd>
      <br>
      <table class="table table-striped">
        <thead>
          <tr>
            <th scope="col">
              Study Name
            </th>
            <th scope="col">
              Cell/Tissue Type
            </th>
            <th scope="col">
              Samples
            </th>
            <th scope="col">
              Donors
            </th>
            <th scope="col">
              Reference
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <!-- TODO: The data ingest pipeline should incorporate study metadata so that we can populate this table by API instead of hardcoding -->
            <th scope="row">
              Cartagene
            </th>
            <td>
              Whole Blood
            </td>
            <td>
              504
            </td>
            <td>
              504
            </td>
            <td>
              <a href="https://doi.org/10.1038/s41467-018-03202-2">Favé et al. 2018</a>
            </td>
          </tr>
          <tr>
            <th scope="row">
              GTEx v8
            </th>
            <td>
              Whole Blood
            </td>
            <td>
              670
            </td>
            <td>
              670
            </td>
            <td>
              <a href="https://doi.org/10.1126/science.aaz1776">The GTEx Consortium 2020</a>
            </td>
          </tr>
        </tbody>
      </table>
    </dl>
  </div>
</template>

<script>
export default {
    name: 'About',
};
</script>

<style scoped>

</style>
