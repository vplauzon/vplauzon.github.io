---
title: Scaling a Multi-Tenant Application with Azure DocumentDB
date: 2014-12-22 18:49:49 -08:00
permalink: /2014/12/22/scaling-a-multi-tenant-application-with-azure-documentdb/
categories:
- Solution
tags:
- NoSQL
---
Following the release of <a href="http://azure.microsoft.com/en-us/documentation/services/documentdb/">Azure DocumentDB</a>, Microsoft NoSQL document-oriented fully managed database, in <a href="http://vincentlauzon.com/2014/09/08/azure-documentdb-first-use-cases/">preview mode</a>, there was initial curiosity. Now we are starting to see more focused questions: how does it scale, can it expose OData, how would I go about architecture my department app around it as the back-end, etc. .

John Macintyre, Program Manager for Azure DocumentDB, wrote <a href="http://azure.microsoft.com/blog/2014/12/03/scaling-a-multi-tenant-application-with-azure-documentdb-2/">a great article about scalability</a>. Going deep into the topic, he explores how to scale, gives a few alternatives and look at what they provide depending on the constraints you have on your scenario (e.g. security, load, etc.).

<img src="http://acom.azurecomcdn.net/80C57D/blogmedia/blogmedia/2014/11/26/shard-example.png" alt="" />

The main pattern he puts forward is sharding and again he doesn't simply skim over the topic but goes deep, analysing the partition scopes (i.e. what do you shard, Accounts, Databases or Collections?) and on which axis you can shard.

He then looks at one of the consequence of sharding: how to you query against many partitions by fanning out queries.

Personally, I find it's a real shame that DocumentDB requires you to manage sharding instead of managing it by itself. It seems to stem from a design decision to optionally offer a certain transaction support across a collection which limits its growth size. I hope in the future we can have opt-in weak-transaction collection with infinite capacity without manual sharding.

Until then, articles like Macintyre's are quite useful to understand the inner working but mostly the choices available to you when you architect a solution based on DocumentDB.