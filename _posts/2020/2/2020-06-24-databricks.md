---
title:  Azure Databricks Overview workshop
permalink: /2020/06/24/azure-databricks-overview-workshop
image:  /assets/posts/2020/2/azure-databricks-overview-workshop/azure-databricks.jpg
categories:
- Solution
tags:
- Data
---
<img style="float:right;padding-left:20px;" title="From pexels.com" src="/assets/posts/2020/2/azure-databricks-overview-workshop/azure-databricks.jpg" />

I haven't written about Databricks for quite a while ([since April 2018](/2018/04/18/python-version-in-databricks/) actually) but I had the pleasure to lead an Azure Databricks workshop with a local customer recently.

For that I prepared quite a few demos now [available on GitHub](https://github.com/vplauzon/databricks/tree/master/features-tour).

I covered quite a few angles so I thought it would be interesting to share the Notebooks publicly.

Here is a list of the Notebooks:

Notebook|Description
-|-
[01-config-mount.py](https://github.com/vplauzon/databricks/blob/master/features-tour/notebooks/01-config-mount.py)|We mount two Azure Storage (Data Lake store) containers to two mounting points in DBFS.  The paths to the Data Lake stores are stored in Environment Variables in Azure Databricks.
[02-spark.py](https://github.com/vplauzon/databricks/blob/master/features-tour/notebooks/02-spark.py)|Here we quickly show what Spark is about:  it's Python (in the case of PySpark anyway) & it deals with DataFrames (mostly).
[03-transform.py](https://github.com/vplauzon/databricks/blob/master/features-tour/notebooks/03-transform.py)|We perform a typical batch transformation here.  We read from a partition of files (a month worth of files), aggregate the data and write it to another folder.
[04-delta.py](https://github.com/vplauzon/databricks/blob/master/features-tour/notebooks/04-delta.py)|This notebook is all about the Delta Lake, both in PySpark and Spark SQL.  Delta Table creation, update, time travel and history description.
[05-streaming.py](https://github.com/vplauzon/databricks/blob/master/features-tour/notebooks/05-streaming.py)|Finally, some structured streaming.

To me Azure Databricks strengths are Data Transformation at scale and Machine Learning training at scale (for parallelizable ML algorithms).  Those notebooks cover the Data Transformation aspect.

I hope this can be useful to see a couple of Spark techniques.