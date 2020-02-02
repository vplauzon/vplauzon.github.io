---
title: Monitoring query performance in Cosmos DB
permalink: /2020/02/19/monitoring-query-performance-in-cosmos-db
categories:
- Solution
tags:
    - Data
    - NoSQL
    - Operations
date:  2020-2-1
---
<img style="float:left;padding-right:20px;" title="From pexels.com" src="/assets/posts/2020/1/monitoring-query-performance-in-cosmos-db/close-up-of-electric-lamp-against-black-background-248747.jpg" />

A common question with Cosmos DB is:  how many [Request Units](https://docs.microsoft.com/en-us/azure/cosmos-db/request-units) (RUs) should I be using?

Although it's easy to quickly guess what you need to start, it's not so trivial to determine exactly what is needed.

My general advice (with Cosmos DB & other DB as a service) is to provision something pessimistically (i.e. put more RUs than not enough) and then monitor.

But how to monitor?

Well, the documentation online now gives us a great couple example of queries:  [Monitoring Azure Cosmos DB](https://docs.microsoft.com/en-us/azure/cosmos-db/monitor-cosmos-db).

It is based on [Azure Monitor](https://docs.microsoft.com/en-us/azure/azure-monitor/overview) and we can therefore query logs using the [Kusto query language](https://docs.microsoft.com/en-us/azure/kusto/query/).  That means that we can slice and dice the logs any way we want to find insights.  That makes it very powerful.

A [section of the doc](https://docs.microsoft.com/en-us/azure/cosmos-db/monitor-cosmos-db#azure-cosmos-db-log-analytics-queries-in-azure-monitor) builds the queries from a simple one to more sophisticated ones.

Just to give an example of the capability, here is one of the queries ran on a collection:

```sql
AzureDiagnostics
| where ResourceProvider=="MICROSOFT.DOCUMENTDB" and Category=="DataPlaneRequests"
| project activityId_g, requestCharge_s
| join kind= inner (
       AzureDiagnostics
       | where ResourceProvider =="MICROSOFT.DOCUMENTDB" and Category == "QueryRuntimeStatistics"
       | project activityId_g, querytext_s
) on $left.activityId_g == $right.activityId_g
| order by requestCharge_s desc
| limit 100
```

activityId_g|requestCharge_s|activityId_g1|querytext_s
---|---|---|---
a3d1...|2.85|a3d1...|{"query":"SELECT {\"p1\": {\"p2\": sum(c.p3)}} AS p4\nFROM c","parameters":[]}
eae0|2.44|eae092b5-94b3-4d12-bab9-4c2c22bca78b|{"query":"SELECT c.id, c._self, c._rid, c._ts, c[\"p1\"] AS p2__18\nFROM c","parameters":[]}
26c0|2.39|26c0|{"query":"SELECT *\nFROM c","parameters":[]}
4f44|2.39|4f44|{"query":"SELECT *\nFROM c","parameters":[]}
d2a5|2.39|d2a5|{"query":"SELECT c.p1, c.p2, c.p3\nFROM c","parameters":[]}
167a|2.36|167a|{"query":"SELECT c.name\nFROM c","parameters":[]}
