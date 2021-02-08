---
title:  Rise of the Data Lake Tables
permalink: /2021/02/10/rise-of-data-lake-tables
image:  /assets/posts/2021/1/2021-02-10-rise-of-data-lake-tables/pexels-caio-3322008.jpg
categories:
- Solution
tags:
- Data
hidden:  true
date: 2021-01-01
---
<img style="float:right;padding-left:20px;" title="From pexels.com" src="/assets/posts/2021/1/2021-02-10-rise-of-data-lake-tables/pexels-caio-3322008.jpg" />

Two weeks ago I attended the [Subsurface Live Winter 2021](https://subsurfaceconf.com/winter2021), *the cloud data lake conference*, presented by [Dremio](https://www.dremio.com/).

One of the star of the show was [Apache Iceberg](https://iceberg.apache.org/), *an open table format for huge analytic datasets* (cf web site).  There were other stars, such as [Project Nessie](https://projectnessie.org/), *a Git-Like Experience for your Data Lake* (cf web site).  But Iceberg talks are the ones that had the most impact for me.  I since watched other talks on YouTube and read some articles about it.

In this article I want to reflect on the significance of Data Lake table formats and what it means for the future of data analytics in the Cloud.

I know there is a lot of power play going on, companies behind Open Source projects trying to position themselves, other companies trying to displace dominant analytic players and the like.  That's the noise.  To me the signal is a real motion in the field motivated by new cloud capabilities.  I don't think that motion will land as far as a lot of players make it sound ([over hyped much](https://en.wikipedia.org/wiki/Hype_cycle?) but it will land at a different place than we are today.

## Data storage models

Before discussing Data Lake Table Formats, let's level-set on a few concepts.  Let's look at some data storage & processing model.

### Database Model

One that most people are familiar with is the database model:

![Database model](/assets/posts/2021/1/2021-02-10-rise-of-data-lake-tables/db.png)

A client (could be an actual end user, could be an application, could be a service) accesses data through a database API (e.g. ODBC).  Behind the scene, the database engine stores the data to files somewhere:  traditionnaly on local hard drives ; in modern systems in cloud storage.  But at the end of the day the data is **stored in binary files in a propriatary format**.

From that perspective, a data warehouse system or any analytical database (e.g. [Azure Data Explorer](https://vincentlauzon.com/2020/02/19/azure-data-explorer-kusto)) is similar to a database.

This model has been around forever for good reasons.  It has lots of advantages, including:

* DB exposes functionalities (e.g. queries) independant of file formats allowing DB software implementation to
    * Evolve independantly of the API
    * Leverage plenty of storage implementations, e.g. atomic flush
    * Have complex storage layout (e.g. mixing column store and row store, indexes, etc.)
* DB becomes a fine-grain access point where we can apply policies:  e.g. data masking, row-level security, encryption, etc.

The major drawback of that model is that *the database owns the data*.  If we want to use another engine to process data we need to first load the data from the database.  That takes up resources from the database and can be quite innefficient.

On premise, that situation wasn't so much of an issue.  Typically we would run databases on dedicated hardware (sometimes appliances), pay for a licence, so we would want to use the database engine to do everything, to justify the expense.

The situation is similar to owning a car:  when we need to move a dishwasher, we're going to use our car.  But if we would rent our car by the hour, we might very well decide to rent a truck to move a dishwasher around instead of squeezing it inside a car.

Similarly, in the cloud we do "rent compute".  Therefore if we have an engine that is better at dealing with geo-spacial data for a specific data-job, we would like to use it instead of forcing every processing to happen on one engine.

### Data Lake Model

Enters the data lake model.  Here we land all data in a common storage layer, the data lake.  We will then have different engines use that data.

![Pick the right tool for the right job](/assets/posts/2021/1/2021-02-10-rise-of-data-lake-tables/right-tool.png)

(This diagram is the "Pick the right tool for the right job" slide I stole from a colleague)

Now the data is freed from database engines (*liberated* if we want to be dramatic).

A lot of the engines will actually need to *load* the data to be efficient with it.  But an unprocessed version of the data is available in the lake for other engines.

![Data Lake Model](/assets/posts/2021/1/2021-02-10-rise-of-data-lake-tables/data-lake.png)

We could look at that situation and observed that we replaced one silo by many.  But actually we can consider the lake as the source of truth and all copies (inside the engines) as "engine cache".

An interesting aspect of that model is that some engine can access the data directly in the lake.  For instance, [Apache Spark](http://spark.apache.org/) (in Azure:  [Azure Databricks](https://docs.microsoft.com/en-us/azure/databricks/scenarios/what-is-azure-databricks), [Apache Spark in Azure Synapse Analytics](https://docs.microsoft.com/en-us/azure/synapse-analytics/spark/apache-spark-overview) or [Azure HDInsight](https://docs.microsoft.com/en-us/azure/hdinsight/)), [Trino](https://trino.io/), [Dremio](https://www.dremio.com/), [Azure Synapse Serverless](https://docs.microsoft.com/en-us/azure/synapse-analytics/sql/on-demand-workspace-overview), [Azure Data Explorer External Tables](https://docs.microsoft.com/en-us/azure/data-explorer/kusto/query/schema-entities/externaltables), etc.  .  This, in turn, opens the door to serverless computing, but we'll cover that later.

The major strenght of this model is also its major weakness.  Because the data is layed out in an open format (Parquet, Avro, CSV, etc.), it can be read by any compute and queryed on directly.  But because it is the lowest common denominator (compared to a database internal files), it is also very unefficient to query.  Querying a lake means opening every file, parsing it and looking for the data pertaining to the query.  It's basically a table scan.  Data might sometimes be partitionned by date and we're lucky by another column (e.g. customer #), but that's about it.  Performance is therefore usually a drag.

Looking away from querying capacity, ingestion is also an issue.  Doing massive ingestion means copying a lot of big files.  Transforming that data midflight can be complex if we consider failure scenario since file copying isn't transactional.  Also, if files are deleted or corrupted, there is no way to go back (unless the underlying storage platform allows it).

### Data Lake tables

Enters Data Lake tables.

Data lake gives us cheap storage & compute independance.  Tables gives us more features:  atomic changes, schema changes and more efficient queries.  They borrow ideas from database internal format, implement it at a data lake scale, for massive tables and persist it into an open format.

[Apache Iceberg](https://iceberg.apache.org/) is such a format, speerheaded by Netflix.  [Delta Lake](https://delta.io/) from Databricks is another one.  [Apache Hudi](https://hudi.apache.org/) is another one.  [Microsoft Hyperspace](https://microsoft.github.io/hyperspace/) is an *early-phase indexing subsystem for Apache Spark*.  So there are a few *standards*.

We can look at [Apache Hive](https://hive.apache.org/) as a common ancestor and those format as an evolution adding features.

The model we are often pitched with Data Lake tables is:

![Data Lake Table Model](/assets/posts/2021/1/2021-02-10-rise-of-data-lake-tables/data-lake-table.png)

Basically, we can forego databases and use open source compute engine to query the lake directly.  In the diagram we've put Apache Delta Lake as table format because it seems to be the one leading on the market and Spark for similar reason.  But the idea can generalized:  any compute with some open table format.

So we are all caught up.  Let's discuss!

## The Hype

First let's address what we think is flimsy about the picture above before we look at what we think is truely valuable and disruptive.

[James Serra](https://www.jamesserra.com) does a great job articulating the [value of data warehouses in a data estate](https://www.jamesserra.com/archive/2017/12/is-the-traditional-data-warehouse-dead/) and is worth a read.

### Standards

The first limitation is temporary in nature rather than technological.

The fact is that Parquet or CSV are just more widespread than Delta Table or Apache Iceberg.

So by storing our data in a Data Lake table means that we automatically have less clients to consume it.

That will likely change over time and is a typical barrier of entry for many technology (chicken and the egg problem).  CSV is still very common for that very reason despite its (many) shortcomings.

### Limits of open table format

The total super set of features we can pack in a table format is inferior to the super set of features of analytical databases.

### Limits of one landing area
### Concurrency
### Security & Governance (including many playing in files)
### Performance of serverless

Until standard arises and is well establishes, you loose independance of engine.

DBs defy some rules of the cloud.  They aren't serverless.  They are stateful.  Statefulness is complicated.

False economies / The dream solution

Trading lot of compute for crappy storage isn't a rational decision

There comes data lake tables

Cross-engine with nessy?

How far can that go?  Governance, security access, concurrency, trust everyone to play with your blobs?

Which scenarios does it address well?  Big data volume with low query volume isn't a