---
title:  A Skeptics Guide to Graph Databases
permalink: /2021/03/17/skeptics-guide-to-graph-databases
image:  /assets/posts/2021/1/2021-03-17-skeptics-guide-to-graph-databases/graph.png
categories:
- Solution
tags:
- Data
date:  2021-03-12
hidden:  true
---
<img style="float:right;padding-left:20px;" title="From pexels.com" src="/assets/posts/2021/1/2021-03-17-skeptics-guide-to-graph-databases/graph.png" />

I found a great talk about graph databases this week!

This one is from the [NDC{Oslo}](https://ndcoslo.com/) conference:  [A Skeptics Guide to Graph Databases](https://www.youtube.com/watch?v=yOYodfN84N4) by [David Bechberger](http://www.bechberger.com/) (author of [Graph Databases in Action](https://www.manning.com/books/graph-databases-in-action?a_aid=bechberger)).

The main "points" of the talk or the things to learn when watching it, for me were:

*   What are Graph Databases?
*   Which use cases are Graph Databases useful for?
*   Which use cases it doesn't perform well
*   Since we can do everything with a relational database (status quo), what problems are better solved with a Graph Database?
*   How to determine if a problem would be a good fit for graph DB
*   A tour of the (very large & immature) landscape
*   Mistakes the speaker did
*   How to be successful

Popularity of Graph DBs (https://db-engines.com/en/ranking_categories)

Math theory


Quick one this week just to mention a great talk I watched!

[A Deep Dive into Spark SQL's Catalyst Optimizer](https://www.youtube.com/watch?app=desktop&v=Xb2zm4-F1HI) with Cheng Lian & Maryann Xue from DataBricks.

The talk is part of the [Carnegie Mellon University Quarantine 2020 Database Talks](https://www.youtube.com/watch?v=PFUZlNQIndo&list=PLSE8ODhjZXjagqlf1NxuBQwaMkrHXi-iz).  Those are organized by [Andy Pavlo](https://www.cs.cmu.edu/~pavlo/), the same Andy giving the [Advanced Database Systems lectures](/2021/01/20/advanced-database-systems).

The talk dives into how Spark SQL treats a query a pass it through its Catalyst Optimizer.  It is interesting as Spark isn't a Database per se and therefore it needs to be quite creative to use traditional cost-based optimization techniques.  Indeed, those are based on statistics over the data but since Spark doesn't *own* the data, the data could change without its knowledge (this is partially addressed by [Apache Delta Table](https://delta.io/)).  It's also interesting to see how the data movement across nodes is addressed in Apache Spark.

Enjoy!