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

Two weeks ago I attended the [Subsurface Live Winter 2021](https://subsurfaceconf.com/winter2021), *the cloud Data Lake conference*, presented by [Dremio](https://www.dremio.com/).

One of the star of the show was [Apache Iceberg](https://iceberg.apache.org/), *an open table format for huge analytic datasets* (cf web site).  There were other stars, such as [Project Nessie](https://projectnessie.org/), *a Git-Like Experience for your Data Lake* (cf web site).  But Iceberg talks are the ones that had the most impact for me.  I since watched other talks on YouTube and read some articles about it.

In this article I want to **reflect on the significance of Data Lake Table Formats** and **what it means for the future of data analytics in the Cloud**.

I know there is a lot of power play going on, companies behind Open Source projects trying to position themselves, other companies trying to displace dominant analytic players and the like.  That's the **noise**.  To me though the **signal** is a real motion in the field motivated by new cloud capabilities.  I don't think that motion will land as far as a lot of players make it sound ([over hyped much](https://en.wikipedia.org/wiki/Hype_cycle?) but it will land at a different place than we are today.

## Data storage models

Before discussing Data Lake Table Formats, let's level-set on a few concepts.  Let's look at some data storage & processing model.

### Database Model

One that most people are familiar with is the database model:

![Database model](/assets/posts/2021/1/2021-02-10-rise-of-data-lake-tables/db.png)

A client (could be an actual end user, could be an application, could be a service) accesses data through a database API (e.g. ODBC).  Behind the scene, the database engine stores the data to files somewhere:  traditionnaly on local hard drives ; in modern systems in cloud storage.  But at the end of the day the data is **stored in a propriatary binary file format**.

From that perspective (and that perspective only), a data warehouse system or other analytical database (e.g. [Azure Data Explorer](https://vincentlauzon.com/2020/02/19/azure-data-explorer-kusto)) is similar to a database.

This model has been around forever for good reasons.  It has lots of advantages, including:

* DB exposes functionalities (e.g. queries) independant of file formats allowing DB software implementation to
    * Evolve independantly of the API
    * Leverage plenty of storage implementations at OS and hardware level, e.g. atomic flush
    * Have complex storage layout (e.g. mixing column store and row store, indexes, etc.) hidden from client
* DB becomes a fine-grain access point where we can apply policies:  e.g. data masking, row-level security, encryption, etc.

The major drawback of that model is that *the database engine owns the data*.  If we want to use another engine to process data we first need to load the data from the database.  That takes up resources from the database engine and can be quite innefficient.

On premise, that situation wasn't so much of an issue.  Typically we would run databases on dedicated hardware (sometimes appliances) and pay for a licence so we would want to use the database engine as much as possible to justify the expense.

The situation is similar to owning a car:  when we need to move a dishwasher, we're going to use our car.  But if we would rent a car by the hour, we might very well drop the car for a few hours, rent a truck to more quickly move the dishwasher around instead of breaking our back squeezing it inside a car.

Similarly, in the cloud we do "rent compute".  Therefore if we have an engine that is better at dealing with geo-spacial data for a specific data-job, we would like to use it instead of forcing every processing to happen on one engine.

### Data Lake Model

Enters the Data Lake model.  Here we land all data in a common storage layer, the Data Lake.  We will then have different engines use that data.

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

Data Lake gives us cheap storage & compute independance.  Tables gives us more features:  atomic changes, schema changes and more efficient queries.  They borrow ideas from database internal format, implement it at a Data Lake scale, for massive tables and persist it into an open format.

[Apache Iceberg](https://iceberg.apache.org/) is such a format, speerheaded by Netflix.  [Delta Lake](https://delta.io/) from Databricks is another one.  [Apache Hudi](https://hudi.apache.org/) is another one.  [Microsoft Hyperspace](https://microsoft.github.io/hyperspace/) is an *early-phase indexing subsystem for Apache Spark*.  So there are a few *standards*.

We can look at [Apache Hive](https://hive.apache.org/) as a common ancestor and those format as an evolution adding features.

The model we are often pitched with Data Lake tables is:

![Data Lake Table Model](/assets/posts/2021/1/2021-02-10-rise-of-data-lake-tables/data-lake-table.png)

Basically, we can forego databases and use open source compute engine to query the lake directly.  In the diagram we've put Apache Delta Lake as table format because it seems to be the one leading on the market and Spark for similar reason.  But the idea can generalized:  any compute with some open table format.

So we are all caught up.  Let's discuss!

## The Hype

<img style="float:left;padding-right:20px;" title="From pexels.com" src="/assets/posts/2021/1/2021-02-10-rise-of-data-lake-tables/pexels-cottonbro-6116860.jpg" />

First let's address what we think is flimsy about the picture above before we look at what we think is truely valuable and disruptive.

[James Serra](https://www.jamesserra.com) does a great job articulating the [value of data warehouses in a data estate](https://www.jamesserra.com/archive/2017/12/is-the-traditional-data-warehouse-dead/) and is worth a read.

### Standards

The first limitation is temporary in nature rather than technological.

The fact is that Parquet or CSV are just more widespread than Delta Table or Apache Iceberg.

So by storing our data in a Data Lake table means that we automatically have less clients to consume it.

That will likely change over time and is a typical barrier of entry for many technology (chicken and the egg problem).  CSV is still very common for that very reason despite its (many) shortcomings.


### Limits of open table format

In one sentence:  *the total super set of features we can pack in a table format is inferior to the super set of features of analytical databases*.

A big advantage of database APIs we mentionned is being a choke point for access control.  How do we implement data masking within a Data Lake?  Once a principal has access to a blob, how can we apply finer grain access?

This is typically implemented at the query engine level (Apache Ranger plug-ins).  That approach is a little ackward with modern approach where passthrough authentication to the lake is used.

Forcing the access to be done through a Spark Connector to enforce control point also breaks the idea that the lake can be accessed by any client and isn't subjected to the tyrany of a data engine.

Basically, for some features, we need some common compute in front of the data.

### Concurrency

The idea of a "storage only" Data Lake brings the idea of decentralized computing, i.e. we do not need to go through one database engine to get to the data.

How does this address concurrency?

Could we have heterogeneous computes ingest data in Data Lake tables at the same time?

We lack deep knowledge in the Data Lake Table Format to answer that question but are skeptical about the capacity as this is general challenge for databases.

Some form of coarse lock (e.g. a lock blob) might be possible but would be a crude solution.

Again a centralized compute layer emmerges as we get deeper into requirements.

### Software evolution

Assuming decentralized compute, how do we address software evolution?

With databases the compute engine is versionned in one block.

What if we have three computes, let's say a Spark engine, a custom Java Service and Trino.  Let's assume an hypothetical scenario where we upgrade our Spark runtime to Apache Iceberg 2.0 which has efficient indexing (this is made up and part of hypothetical scenario).  How does the Java Service and Trino runtime react to suddently having Iceberg 2.0 artefacts in the Data Lake?  Or the other way around?

This is basically a challenge with decentralized servers.

Again, we see the need for a centralized compute layer emmerging.

### Limits of one landing area

Can one table format rule them all?  There is a reason why there are multiple database engines around.  They each made different design trade offs:  they are better at some things, worse at others.

We can easily imagine that would be the same thing for open table format.

### Caching

A big component for database engines is caching.  Recently, in-memory database systems are quite a thing.

Having decentralized compute torpedoes the possibility of cache.  Having decentralized caching systems with cache invalidation is a *difficult* problem.

Without caching, query performance, especially concurrent queries on fast moving data, is poor.

This is why running reports on top of serverless compute on top of a Data Lake is slow and a bad idea in general.

### Trusting the different computes

Looking at a landscape where we have multiple kind of compute accessing a Data Lake, can we trust them all?

Especially if we consider the preceeding point where we would like the table format to allow for concurrency, software evolution, indexing, etc.  .  Do we trust that the Python library we just downloaded handle those without any bugs?

Here again we face the challenges of distributed compute.  Would we be comfortable to let multiple services access and update internal Postgres files?

## So where is the disruption?

In the previous section we addressed a few shortcomings of the Data Lake Table paradigm.  Or more specifically, the paradigm that is not often stated explicitly but assumed, i.e. that by having a standard table format for Data Lakes, we could have **multiple**, **heterogeneous** compute **concurrency** accessing & ingesting data.

We saw that if we push that reasoning a little we face a lot of shortcomings where having a single compute layer or at least an homogeneous compute layer would be either required or more efficient.

So that paradigm basically becomes Apache Spark in front of Apache Delta Lake.

![Delta Lake](/assets/posts/2021/1/2021-02-10-rise-of-data-lake-tables/delta-lake.png)

Aren't we back to the database model?

Not quite but in truth we are much closer than all the noise surounding Open Data Lake Table Formats would have us believe.

What remains and is it disruptive?  In short we believe it is.

### Open platform

First obvious advantage of that architecture is that it is open.

If somebody come up with a better algorithm for pruning search branches, they can theoritically submit it to the Apache Spark code base.

If someone could figure out a funky engine that could, for example, look at tables, ignore everything that isn't time & geospatial and come up with super-optimized geospatial time series, they could do it without re-ingesting the data.

### Basis for specialization

We don't believe that one platform / implementation will rule them all.  If database history has shown one thing is that there is no tradeoff that satisfy all scenarios.

What we could end up with is a bases for future, more specialized, implementation.  [Apache Arrow](https://arrow.apache.org/) has become a basis for in-memory columnar format.  The same way an evolution of Apache Delta Lake could become the basis for data at rest table representation.

Standards are good.  Reinventing the wheel doesn't always bring value.

Having standard at the table storage layer could bring deeper integration between heterogeneous query engines.

For instance, we could have a database system that is built on Data Lake tables.  It could, for instance, add indexes on top of Apache Delta Lake.  This wouldn't require re-ingesting the data, simply indexing it.  Other databases could add other meta data on their own.

### Serverless

Data Lake tables kind of facilitate or encourage serverless.

Databases have long defied the rules of cloud computing.  A database isn't serverless by nature.  It is stateful.  Stateful is difficult.  We can't simply load balance a stateful workload as we load balance a compute workload.

For that reason databases typically are provisionned once and run 24/7.  Some databases such as Azure Cosmos DB allow for efficient auto scale or every serverless, but most do not.

An analytical scenario that makes perfect sense for serverless is a moderately large amount of data that is accessed seldomly.  It makes sense to provision compute per query then.  The query will be slow to start and slow to execute but with modern compute, results can be achieved in seconds on GB of data.

Especially if we standardize on Azure Spark, then it becomes viable for a cloud provider to share compute to provide serverless computing.

### Features at the storage layer

Cloud storage isn't our old dumb storage.  We aren't querying a SCSI endpoint in the cloud.  Cloud storage are multi-layered scalable systems.

If a standard table format emerge, features could be moved at the storage layer.

It would then make sense to have fine grain security (e.g. column security, data masking, etc.), indexing and maybe even caching implemented at the storage layer.

## Summary

In this article I wanted to do two things:

1.   Debunk some ideas about Data Lake and decentralized compute
1.   Show how disruptive a standard Data Lake Table Format could be

Too often I see Data Lakes being misused.  Putting Apache Spark on top of raw files is often very unefficient.

Remember that cloud providers (e.g. Azure) sells three types of resources:

1. Compute
1. Storage
1. Networking

Those are in order of magnitude of cost which means that compute is an order of magnitude more expensive than storage.

Storing a Data Warehouse worth of data in cheap un-indexed storage to then query it with tons of compute (to compensate) doesn't make economical sense.

That is why I believe specialized data engines (e.g. Data Warehouse, Real Time Analytics, etc.) are not a dying breed.

On the other hand, the need for specialized engines could drop substancially with the adoption of a Data Lake Table Format and an homogeneous compute on top of it.

I am still skeptical that Apache Delta Lake (or Apache Iceberg) is the former and that Apache Spark is the latter.  It might require a few attempts to find the right balance between feature-richness and openness for extension.  A new generation of technology might need to come to life for those ideas to bare fruits.

What do you think?  Leave your comments down below.