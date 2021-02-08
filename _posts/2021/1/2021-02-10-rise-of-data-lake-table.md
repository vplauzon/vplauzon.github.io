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

I always found those Open Source conferences interesting.  They make me breath fresh air outside the Microsoft world.

In this article I want to reflect on the significance of Data Lake table formats and what it means.  I'm not dupe, I know there is a lot of power play going on, companies behind Open Source projects trying to position themselves, other companies trying to displace dominant analytic players and the like.  That's the noise.  But I think there is a real motion in the field motivated by new cloud capabilities.  I don't think that motion will land as far as a lot of players make it sound ([over hyped much](https://en.wikipedia.org/wiki/Hype_cycle?) but it will land at a different place than we are today.

## Data lake vs Data Warehouse / Database

Let's look at some data storage & processing model.

One that most people are familiar with is the database model:

![Database model](/assets/posts/2021/1/2021-02-10-rise-of-data-lake-tables/db.png)

https://www.jamesserra.com/archive/2017/12/is-the-traditional-data-warehouse-dead/

DBs defy some rules of the cloud.  They aren't serverless.  They are stateful.  Statefulness is complicated.

False economies / The dream solution

Trading lot of compute for crappy storage isn't a rational decision

There comes data lake tables

Data lake gives you cheap storage, independance of engine.  Tables give you more features (e.g. atomic changes) and more efficient queries.  Until standard arises and is well establishes, you loose independance of engine.

Cross-engine with nessy?

How far can that go?  Governance, security access, concurrency, trust everyone to play with your blobs?

Which scenarios does it address well?  Big data volume with low query volume isn't a