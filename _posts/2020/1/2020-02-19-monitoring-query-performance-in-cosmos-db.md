---
title: Monitoring query performance in Cosmos DB
permalink: /2020/02/19/monitoring-query-performance-in-cosmos-db
categories:
- Solution
tags:
    - Data
    - NoSQL
    - Operations
date:  2020-1-1
---
<img style="float:left;padding-right:20px;" title="From pexels.com" src="/assets/posts/2020/1/monitoring-query-performance-in-cosmos-db/close-up-of-electric-lamp-against-black-background-248747.jpg" />

A common question with Cosmos DB is:  how many [Request Units](https://docs.microsoft.com/en-us/azure/cosmos-db/request-units) (RUs) should I be using?

Although it's easy to quickly guess what you need to start, it's not so trivial to determine exactly what is needed.

My general advice (with Cosmos DB & other DB as a service) is to provision something pessimistically (i.e. put more RUs than not enough) and then monitor.

But how to monitor?

Well, the documentation online now gives us a great couple example of queries:  [Monitoring Azure Cosmos DB](https://docs.microsoft.com/en-us/azure/cosmos-db/monitor-cosmos-db).