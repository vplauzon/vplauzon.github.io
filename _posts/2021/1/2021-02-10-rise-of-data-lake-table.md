---
title:  Rise of the Data Lake Tables
permalink: /2021/02/10/rise-of-data-lake-tables
image:  /assets/posts/2021/1/2021-02-10-rise-of-data-lake-tables/pexels-caio-3322008.jpg
categories:
- Solution
tags:
- Data
- Operation
hidden:  true
date: 2021-01-01
---
<img style="float:right;padding-left:20px;" title="From pexels.com" src="/assets/posts/2021/1/2021-02-10-rise-of-data-lake-tables/pexels-caio-3322008.jpg" />

There is a motion and it's going to land somewhere.  But there is a lot of noise.

DBs defy some rules of the cloud.  They aren't serverless.  They are stateful.  Statefulness is complicated.

False economies / The dream solution

Trading lot of compute for crappy storage isn't a rational decision

There comes data lake tables

Data lake gives you cheap storage, independance of engine.  Tables give you more features (e.g. atomic changes) and more efficient queries.  Until standard arises and is well establishes, you loose independance of engine.

Cross-engine with nessy?

How far can that go?  Governance, security access, concurrency, trust everyone to play with your blobs?

Which scenarios does it address well?  Big data volume with low query volume isn't a