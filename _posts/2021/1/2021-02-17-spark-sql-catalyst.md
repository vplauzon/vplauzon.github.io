---
title:  Spark SQL Catalyst
permalink: /2021/02/17/spark-sql-catalyst
image:  /assets/posts/2021/1/2021-02-17-spark-sql-catalyst/quarantine-talks.png
categories:
- Solution
tags:
- Data
hidden:  true
date: 01-01-2021
---
<img style="float:left;padding-right:20px;" title="From pexels.com" src="/assets/posts/2021/1/2021-02-17-spark-sql-catalyst/quarantine-talks.png" />

Quick one this week just to mention a great talk I watched!

[A Deep Dive into Spark SQL's Catalyst Optimizer](https://www.youtube.com/watch?app=desktop&v=Xb2zm4-F1HI) with Cheng Lian & Maryann Xue from DataBricks.

The talk is part of the [Carnegie Mellon University Quarantine 2020 Database Talks](https://www.youtube.com/watch?v=PFUZlNQIndo&list=PLSE8ODhjZXjagqlf1NxuBQwaMkrHXi-iz).  Those are organized by [Andy Pavlo](https://www.cs.cmu.edu/~pavlo/), the same Andy giving the [Advanced Database Systems lectures](/2021/01/20/advanced-database-systems).

The talk dives into how Spark SQL treats a query a pass it through its Catalyst Optimizer.  It is interesting as Spark isn't a Database per se and therefore it needs to be quite creative to use traditional cost-based optimization techniques.  Indeed those are based on statistics over the data but since Spark doesn't *own* the data, the data could change without its knowledge (this is partially addressed by [Apache Delta Table](https://delta.io/)).  It's also interesting to see how the data movement across nodes is addressed in Apache Spark.

Enjoy!