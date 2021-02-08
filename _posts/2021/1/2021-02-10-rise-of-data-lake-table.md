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

## Data lake vs Data Warehouse / Database

Before discussing Data Lake Table Formats, let's level-set on a few concepts.  Let's look at some data storage & processing model.

One that most people are familiar with is the database model:

![Database model](/assets/posts/2021/1/2021-02-10-rise-of-data-lake-tables/db.png)

A client (could be an actual end user, could be an application, could be a service) accesses data through a database API (e.g. ODBC).  Behind the scene, the database engine stores the data to files somewhere:  traditionnaly on local hard drives ; in modern systems in cloud storage.  But at the end of the day the data is **stored in binary files in a propriatary format**.

This model has been around forever for good reasons.  It has lots of advantages, including:

* DB exposes functionalities (e.g. queries) independant of file formats allowing DB software implementation to
    * Evolve independantly of the API
    * Leverage plenty of storage implementations, e.g. atomic flush
    * Have complex storage layout (e.g. mixing column store and row store, indexes, etc.)
* DB becomes a fine-grain access point where we can apply policies:  e.g. data masking, row-level security, encryption, etc.



From that perspective, a data warehouse system or any analytical database (e.g. [Azure Data Explorer](https://vincentlauzon.com/2020/02/19/azure-data-explorer-kusto)) is similar to a database.

https://www.jamesserra.com/archive/2017/12/is-the-traditional-data-warehouse-dead/

DBs defy some rules of the cloud.  They aren't serverless.  They are stateful.  Statefulness is complicated.

False economies / The dream solution

Trading lot of compute for crappy storage isn't a rational decision

There comes data lake tables

Data lake gives you cheap storage, independance of engine.  Tables give you more features (e.g. atomic changes) and more efficient queries.  Until standard arises and is well establishes, you loose independance of engine.

Cross-engine with nessy?

How far can that go?  Governance, security access, concurrency, trust everyone to play with your blobs?

Which scenarios does it address well?  Big data volume with low query volume isn't a