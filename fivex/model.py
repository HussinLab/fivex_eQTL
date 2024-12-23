"""
Models/ datastores
"""
import gzip
import json
import math
import os
import sqlite3

from flask import abort, current_app


# Merged data split into 1Mbps chunks - only query this for single variant data
def locate_data(chrom: str, startpos: int, datatype: str = "ge"):
    start = math.floor(startpos / 1000000) * 1000000 + 1
    end = start + 999999

    # FIXME: Inject strict validation in callers before this ever hits this function
    chrom = os.path.basename(chrom)

    return os.path.join(
        current_app.config["FIVEX_DATA_DIR"],
        f"ebi_{datatype}",
        chrom,
        f"all.EBI.{datatype}.data.chr{chrom}.{start}-{end}.tsv.gz",
    )


# Study- and tissue-specific data - query this for region view
def locate_study_tissue_data(study, tissue, datatype="ge"):
    study = os.path.basename(study)
    tissue = os.path.basename(tissue)

    return os.path.join(
        current_app.config["FIVEX_DATA_DIR"],
        "ebi_original",
        datatype,
        study,
        f"{study}_{datatype}_{tissue}.all.tsv.gz",
    )


# Signed tss data: positive TSS = Plus strand, negative TSS = Minus strand
def locate_tss_data():
    return os.path.join(
        current_app.config["FIVEX_DATA_DIR"], "gencode", "tss.json.gz",
    )


# Sorted and filtered gencode data
def locate_gencode_data():
    return os.path.join(
        current_app.config["FIVEX_DATA_DIR"],
        "gencode",
        "gencode.v30.annotation.gtf.genes.bed.gz",
    )


# Sorted and filtered gencode transcripts data
def locate_gencode_transcript_data():
    return os.path.join(
        current_app.config["FIVEX_DATA_DIR"],
        "gencode",
        "gencode.v30.annotation.gtf.transcripts.bed.gz",
    )


# A database that stores the point with the highest PIP at each variant
def get_best_per_variant_lookup(data_type: str = "ge",):
    # TODO: dedup datatype value usage. make enum with ge or txrev for e and sqtls
    """Get the path to an SQLite3 database file describing the best study,
    tissue, and gene for any given variant"""
    return os.path.join(
        current_app.config["FIVEX_DATA_DIR"],
        "credible_sets",
        data_type,
        "pip.best.variant.summary.sorted.indexed.sqlite3.db",
    )


# Uses the database above to find the if Cartagene exists when there's a result. If not, returns GTEx, otherwise, returns Cartagene, even if it's not the best hit.
def get_best_study_tissue_gene(
    chrom, start=None, end=None, study=None, tissue=None, gene_id=None
):
    conntest = sqlite3.connect(get_best_per_variant_lookup())
    study_test="Cartagene"
    with conntest:
        try:
            cursor = conntest.cursor()
            sqlCommand_test = "SELECT * FROM sig WHERE chrom=?"
            argsList = [chrom]
            if start is not None:
                if end is not None:
                    sqlCommand_test += " AND pos BETWEEN ? AND ?"
                    argsList.extend([start, end])
                else:
                    sqlCommand_test += " AND pos=?"
                    argsList.append(start)
            if study_test is not None:
                sqlCommand_test += " AND study=?"
                argsList.append(study_test)
            if tissue is not None:
                sqlCommand_test += " AND tissue=?"
                argsList.append(tissue)
            if gene_id is not None:
                sqlCommand_test += " AND gene_id=?"
                argsList.append(gene_id)
            sqlCommand_test += " ORDER BY pvalue LIMIT 1"
            (
                pvalue,
                study,
                tissue,
                gene_id,
                chrom,
                pos,
                ref,
                alt,
                _,
                _,
                _,
            ) = list(cursor.execute(sqlCommand_test, tuple(argsList),))[0]
            study = "Cartagene"
        except IndexError:
            study = None
            
    conn = sqlite3.connect(get_best_per_variant_lookup())
    with conn:
        try:
            cursor = conn.cursor()
            sqlCommand = "SELECT * FROM sig WHERE chrom=?"
            argsList = [chrom]
            if start is not None:
                if end is not None:
                    sqlCommand += " AND pos BETWEEN ? AND ?"
                    argsList.extend([start, end])
                else:
                    sqlCommand += " AND pos=?"
                    argsList.append(start)
            if study is not None:
                sqlCommand += " AND study=?"
                argsList.append(study)
            if tissue is not None:
                sqlCommand += " AND tissue=?"
                argsList.append(tissue)
            if gene_id is not None:
                sqlCommand += " AND gene_id=?"
                argsList.append(gene_id)
            sqlCommand += " ORDER BY pvalue LIMIT 1"
            (
                pvalue,
                study,
                tissue,
                gene_id,
                chrom,
                pos,
                ref,
                alt,
                _,
                _,
                _,
            ) = list(cursor.execute(sqlCommand, tuple(argsList),))[0]
            bestVar = (gene_id, chrom, pos, ref, alt, pvalue, study, tissue)
            #print("TEST : ",bestVar)
            return bestVar
        except IndexError:
            return abort(400)


def get_gene_names_conversion():
    """Get the compressed file containing two-way mappings of gene_id to gene_symbol"""
    with gzip.open(
        os.path.join(
            current_app.config["FIVEX_DATA_DIR"], "gene.id.symbol.map.json.gz",
        ),
        "rt",
    ) as f:
        return json.loads(f.read())


# If requesting a single variant, then return the merged credible_sets file for a single chromosome
# Otherwise, return the study-specific, tissue-specific file that contains genomewide information
def get_credible_interval_path(chrom, study=None, tissue=None, datatype="ge"):
    # FIXME: Inject strict validation in callers before this ever hits this function
    chrom = os.path.basename(chrom)

    if not study and not tissue:
        # Overall "best" information
        return os.path.join(
            current_app.config["FIVEX_DATA_DIR"],
            "credible_sets",
            datatype,
            f"chr{chrom}.{datatype}.credible_set.tsv.gz",
        )
    else:
        # FIXME: Inject strict validation in callers before this ever hits this function
        study = os.path.basename(study)
        tissue = os.path.basename(tissue)

        return os.path.join(
            current_app.config["FIVEX_DATA_DIR"],
            "credible_sets",
            datatype,
            study,
            f"{study}.{tissue}_{datatype}.purity_filtered.sorted.txt.gz",
        )


# Return the chromosome-specific filename for the merged credible sets data
def get_credible_data_table(chrom, datatype="ge"):
    # FIXME: Inject strict validation in callers before this ever hits this function
    chrom = os.path.basename(chrom)

    return os.path.join(
        current_app.config["FIVEX_DATA_DIR"],
        "credible_sets",
        datatype,
        f"chr{chrom}.{datatype}.credible_set.tsv.gz",
    )


# Takes in chromosome and position, and returns (chrom, pos, ref, alt, rsid)
# rsid.sqlite3.db is created by util/create.rsid.sqlite3.py
def return_rsid(chrom, pos):
    rsid_db = os.path.join(
        current_app.config["FIVEX_DATA_DIR"], "rsid.sqlite3.db"
    )
    conn = sqlite3.connect(rsid_db)
    with conn:
        try:
            cursor = conn.cursor()
            return list(
                cursor.execute(
                    "SELECT * FROM rsidTable WHERE chrom=? AND pos=?",
                    (chrom, pos),
                )
            )[0]
        except ValueError:
            # TODO: Document schema of the database table and what these placeholder values mean
            return [chrom, pos, "N", "N", "Unknown"]
