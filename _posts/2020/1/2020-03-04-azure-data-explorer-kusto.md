---
title: Azure Data Explorer (Kusto)
permalink: /2020/03/04/azure-data-explorer-kusto
categories:
- Solution
tags:
    - BigData
    - Data
date: 2020-02-12
---
<img style="float:left;padding-right:20px;" title="From pexels.com" src="/assets/posts/2020/1/azure-data-explorer-kusto/silhouette-of-person-holding-glass-mason-jar-1274260.jpg" />

Let's talk about [Azure Data Explorer](https://docs.microsoft.com/en-us/azure/data-explorer/data-explorer-overview) (ADX ![ADX](/assets/posts/2020/1/azure-data-explorer-kusto/logo-analytics-145-Azure-Data-Explorer-Clusters.svg)) also known as Kusto.

If you ask me that is the best kept secret in Azure.

Well, it isn't exactly a secret but most people do not know about it or if they do, they just think of it as the back-end engine behind [Azure Monitor](https://docs.microsoft.com/en-us/azure/azure-monitor/overview).

ADX is an [Azure Analytics Service](https://azure.microsoft.com/en-us/services/#analytics).  It is great at analyzing large volume of near real time telemetry such as logs and IoT.

Isn't that what [Azure Datawarehouse](https://vincentlauzon.com/2016/07/31/how-does-azure-data-warehouse-scale/) is supposed to do?  Or [Azure Databricks](https://vincentlauzon.com/2017/12/18/azure-databricks-getting-started/)?

In this article, I'll go around characteristics of the service:  what its strength are and where it is complemented by other services.

I started with a huge essay trying to cover every aspects but I was bored writing it so I guess it wouldn't have been very exciting to reading material.  I went with a much lighter version. I'll explore it further in future articles.

## Scale & Performance

<img style="float:right;padding-left:20px;" title="From pexels.com" src="/assets/posts/2020/1/azure-data-explorer-kusto/photo-of-clay-jars-3692053.jpg" />

The [online documentation](https://docs.microsoft.com/en-us/azure/data-explorer/data-explorer-overview#what-makes-azure-data-explorer-unique) says it scales to terabytes of data in minutes.

That is true but it is also true of many distributed data services.

The uniqueness comes in what we can do at that scale.

At heart Azure Data Explorer (ADX) is about...  Data Exploration.  It is a real challenge to explore data at the Terabyte scale with little data preparation, i.e. no defined indexes & no pre-computed aggregations.

* ADX is a very fast engine that can perform **ad hoc queries**, such as aggregations on high volume of data in a few seconds, often in less than a second.  This enables a truly interactive experience where each query teaches us something about the data and leads us to the next question we want to ask.

* Aggregations are fine but aggregating over huge data set often result in losing information.  It is akin to looking at a forest and be told it is made of wood.  Accurate but not insightful.  One of ADX' strength is [Time Series](https://en.wikipedia.org/wiki/Time_series) [analysis](https://docs.microsoft.com/en-us/azure/data-explorer/time-series-analysis).  This allows us to take a use data set and split it in multiple series and analyse those series separately or as a whole.
* ADX can perform some [Machine Learning](https://docs.microsoft.com/en-us/azure/data-explorer/machine-learning-clustering) (ML) algorithm through a big data sets or use a pre-trained model (e.g. in Python) and use the prediction of a model in the queries.
* ADX can process **structured, semi-structured & unstructured** at great speed.  Although other solutions can go through small sets of JSON or text fields, they usually take minutes to process large data sets.  ADX answers in seconds.
* [Visualisation](https://docs.microsoft.com/en-us/azure/data-explorer/viz-overview) is part of the exploration and can be challenging in huge data sets.  Visualization is part of the query language.  It seems odd at first but turns out to be very productive.
* The query language, [Kusto](https://docs.microsoft.com/en-us/azure/data-explorer/write-queries), is unique to ADX.  This also seems odd at first:  isn't SQL the perfect language to query data?  It turns out Kusto is way more productive than SQL for analytics.  For someone proficient in SQL it takes 1-3 hours to become a Kusto query language expert.  In addition, ADX also supports [TSQL](https://docs.microsoft.com/en-us/azure/kusto/api/tds/t-sql).

## Near real time

<img style="float:left;padding-right:20px;" title="From pexels.com" src="/assets/posts/2020/1/azure-data-explorer-kusto/adult-backpack-blur-business-298018.jpg" />

* ADX operates in the **near-real time window**.  Unlike at Datawarehouse updated hourly (or less), ADX provides latency of less than a minute using batch ingestion and a few seconds latency using [streaming ingestion](https://docs.microsoft.com/en-us/azure/data-explorer/ingest-data-streaming).
* In order to have this low latency of data "freshness", ADX can **ingest data by itself**, without relying on external services (such as Azure Data Factory).  For instance it can [ingest data from Event Hub directly](https://docs.microsoft.com/en-us/azure/data-explorer/data-connection-event-hub-python).
* Since it can ingest data by itself, it can also **transform the data as it is ingested** (cf [update policy](https://docs.microsoft.com/en-us/azure/kusto/management/update-policy)).

## Integration

<img style="float:right;padding-left:20px;" title="From pexels.com" src="/assets/posts/2020/1/azure-data-explorer-kusto/person-holding-white-wireless-electronic-device-3531849.jpg" />

ADX has an impressive gallery of integration for such a young service:

* Azure Data Factory
* Spark
* Jupyter Notebooks
* Azure Pipelines
* Event Hub
* Event Grid
* IoT Hub
* Kafka
* Logstash
* Power BI
* Excel
* Grafana
* Tableau
* ODBC connector
* Sisense
* Redash
* Python (i.e. running Python within queries)
* R (i.e. similar to Python)
* SQL Server (including Azure SQL & Azure Synapse SQL Pools)

The list is growing and doesn't contain only Azure technology.  ADX can therefore easily be part of a bigger solution.

## What ADX isn't optimal for / stretch scenarios

<img style="float:left;padding-right:20px;" title="From pexels.com" src="/assets/posts/2020/1/azure-data-explorer-kusto/animal-animal-photography-big-big-cat-572861.jpg" />

The public cloud brought a lot of fragmentation in the Data services.  Although part of the reasons for that is the youth of the public cloud technologies, it is also due to inherent characteristics of big data analytics in the cloud:

> Since we do not own the hardware the workloads are running on, we do not have to get married with one technology and run everything on it to amortise the cost of said hardware / licence.  We can use the best tool for the job.

This is a balancing act as we need to take the skill set of people into account.

Most of the scenarios we are citing here can be done with ADX but it wouldn't be the best platform to do so.

Scenario|Why|Azure PaaS Alternatives
-|-|-
[Data warehouse](https://en.wikipedia.org/wiki/Data_warehouse)|For starter, ADX is mostly an append-only store.  It isn't transactional, doesn't have log journals, etc.  .  This is part of the reasons it is so fast, but also part of the reasons it is a poor fit for a Datawarehouse.  Also, although it is very fast, pre-computed aggregations would be better for dashboards.  For the sceptics, [the rumors of data warehousing's dead have been greatly exaggerated](https://www.jamesserra.com/archive/2017/12/is-the-traditional-data-warehouse-dead/).|[Azure Synapse](https://docs.microsoft.com/en-us/azure/sql-data-warehouse/sql-data-warehouse-overview-what-is) & [Power BI Premium](https://docs.microsoft.com/en-us/power-bi/service-premium-what-is)
Application Back end|Similar to Data warehousing, ADX isn't built as a transactional workload.|[Cosmos DB](https://docs.microsoft.com/en-us/azure/cosmos-db/introduction), [Azure SQL DB](https://docs.microsoft.com/en-us/azure/sql-database/sql-database-technical-overview), [Azure PostgreSQL](https://docs.microsoft.com/en-us/azure/postgresql/), [Azure MySQL](https://docs.microsoft.com/en-us/azure/mysql/overview), [Azure MariaDB](https://docs.microsoft.com/en-us/azure/mariadb/overview)
[Machine Learning](https://en.wikipedia.org/wiki/Machine_learning) (ML) Training|ADX supports some built-in [ML algorithms](https://docs.microsoft.com/en-us/azure/data-explorer/machine-learning-clustering) (mostly clustering algorithms and statistical tools at the time of this writing, i.e. February 2020), it isn't an ML training platform.  It is excellent for running prediction on a pre-training model though.|[Azure ML](https://docs.microsoft.com/en-us/azure/machine-learning/overview-what-is-azure-ml), Spark ([Azure Databricks](https://docs.microsoft.com/en-us/azure/databricks/getting-started/spark/machine-learning) or [Azure HD Insight](https://docs.microsoft.com/en-us/azure/hdinsight/hdinsight-overview)), [Azure Batch](https://docs.microsoft.com/en-us/azure/batch/batch-technical-overview) & [Data Science Virtual Machine](https://docs.microsoft.com/en-us/azure/machine-learning/data-science-virtual-machine/overview) (DSVM)
Sub-second streaming|ADX can go as low as seconds of latency in ingesting data.  At that latency it is still able to do analytics (i.e. events are still indexed and can be queried).  Most "near real time" scenarios fall comfortably within that window.  But it isn't a sub-second streaming platform (e.g. for low-latency-trading).|[Azure Stream Analytics](https://docs.microsoft.com/en-us/azure/stream-analytics/stream-analytics-introduction), [Structured Streaming in Continuous Mode in Spark](https://databricks.com/blog/2018/03/20/low-latency-continuous-processing-mode-in-structured-streaming-in-apache-spark-2-3-0.html) ([Azure Databricks](https://docs.microsoft.com/en-us/azure/databricks/getting-started/spark/streaming) or [Azure HD Insight](https://docs.microsoft.com/en-us/azure/hdinsight/hdinsight-overview)), [Kafka Streams](https://kafka.apache.org/documentation/streams/) on [Azure HD Insight](https://docs.microsoft.com/en-us/azure/hdinsight/hdinsight-overview), [Flink](https://flink.apache.org/) on [Azure HD Insight](https://docs.microsoft.com/en-us/azure/hdinsight/hdinsight-overview)

## Concrete scenarios

<img style="float:right;padding-left:20px;" title="From pexels.com" src="/assets/posts/2020/1/azure-data-explorer-kusto/aerial-photography-of-cars-on-the-road-1123972.jpg" />

Here are some scenarios we've seen in different industries.  This is by no mean an exhaustive list but the popular scenarios.

Quite a few customers are using ADX / Kusto to analyze unified logs, i.e. logs from on-premise systems and different clouds.  This is typical log analysis, so it could be for security, reliability engineering, forecasting, etc.  .

IoT telemetry analysis is quite popular.  As customers capture telemetry, they want to mine that data.

We see different businesses using it to analyze transactions (sales) to understand customer behaviours, predict trends or spike and optimize go-to-market strategy.  What if in days of deploying a new product we could figure out what customer segment is having traction and which ones are lagging?

In general, we see customers starting with historical analysis and then move to more and more real time analysis as the teams are getting more comfortable with the service.

## Summary

We hope we manage to give a good idea of what ADX can do.

It is also important to note that it is the data platform for other Azure Services:

* [Azure Monitor logs](https://docs.microsoft.com/en-us/azure/azure-monitor/overview)
* [Application Insights](https://docs.microsoft.com/en-us/azure/azure-monitor/app/app-insights-overview)
* [Azure Sentinel](https://docs.microsoft.com/en-us/azure/sentinel/overview)
* [Time Series Insights](https://docs.microsoft.com/en-us/azure/time-series-insights/time-series-insights-update-overview)
* [XBOX PlayFab](https://playfab.com/add-ons/xbox-live/)
* [Microsoft Cloud App Security](https://docs.microsoft.com/en-us/cloud-app-security/what-is-cloud-app-security)
* [Windows Defender Advanced Threat Protection](https://docs.microsoft.com/en-us/windows/security/threat-protection/microsoft-defender-atp/microsoft-defender-advanced-threat-protection)
