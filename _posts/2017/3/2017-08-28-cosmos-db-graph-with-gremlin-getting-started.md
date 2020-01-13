---
title: Cosmos DB & Graph with Gremlin - Getting Started
date: 2017-08-28 18:20:32 -07:00
permalink: /2017/08/28/cosmos-db-graph-with-gremlin-getting-started/
categories:
- Solution
tags:
- NoSQL
---
<p><a href="/assets/posts/2017/3/cosmos-db-graph-with-gremlin-getting-started/gremlin-apache1.png"><img width="240" height="178" title="gremlin-apache[1]" align="left" style="border:0 currentcolor;border-image:none;float:left;display:inline;background-image:none;" alt="gremlin-apache[1]" src="/assets/posts/2017/3/cosmos-db-graph-with-gremlin-getting-started/gremlin-apache1_thumb.png" border="0"/></a>Azure Cosmos DB is Microsoft’s globally distributed multi-model database service.</p>
<p>One of the paradigm it supports is Graph:&nbsp; Cosmos DB can be used to store and query graphs.</p>
<p>At the time of this writing, it supports one interface, <a href="https://en.wikipedia.org/wiki/Gremlin_(programming_language)" target="_blank">Gremlin</a>, which is part of the <a href="http://tinkerpop.apache.org/" target="_blank">Apache TinkerPop project</a>.</p>
<p>This means we can use any Gremlin Console to connect to a Cosmos DB graph.</p>
<p>That is well documented.&nbsp; I won’t reproduce the steps here.&nbsp; Instead, I’m going to point to documentation.</p>
<h2>Understanding Gremlin</h2>
<p>First thing, let’s understand Gremlin.&nbsp; Gremlin is to graph data what SQL is to relational data ; it is a <a href="https://en.wikipedia.org/wiki/Graph_traversal" target="_blank">graph traversal</a> language.&nbsp; Except the debate hasn’t fully settled in the graph world and Gremlin has meaningful competition (e.g. <a href="https://en.wikipedia.org/wiki/Cypher_Query_Language" target="_blank">Cypher</a>).</p>
<p>TinkerPop project site contains a very good documentation for <a href="http://tinkerpop.apache.org/docs/current/tutorials/getting-started/" target="_blank">getting started with Gremlin</a>.&nbsp; Their sales pitch is “learn it in 30 minutes” and it’s pretty accurate.</p>
<p>Once we’ve absorbed that, we can go deeper with the <a href="http://tinkerpop.apache.org/docs/3.2.5/reference/" target="_blank">online exhaustive documentation</a>.</p>
<h1><br />
Gremlin with Cosmos DB</h1>
<p><a href="/assets/posts/2017/3/cosmos-db-graph-with-gremlin-getting-started/cosmos-db1.png"><img width="200" height="178" title="cosmos-db[1]" align="right" style="border:0 currentcolor;border-image:none;float:right;display:inline;background-image:none;" alt="cosmos-db[1]" src="/assets/posts/2017/3/cosmos-db-graph-with-gremlin-getting-started/cosmos-db1_thumb.png" border="0"/></a>Azure documentation has a good guide to both <a href="https://docs.microsoft.com/en-us/azure/cosmos-db/create-graph-gremlin-console" target="_blank">create a Cosmos DB graph and connect to it with a Gremlin Console</a>.</p>
<p>We can download the <a href="http://tinkerpop.apache.org/" target="_blank">Gremlin Console from the Tinkerpop’s site</a>.&nbsp; It contains both Windows &amp; Unix consoles.</p>
<p align="left">Personally, I’ve installed it in the <a href="https://msdn.microsoft.com/en-us/commandline/wsl/install_guide" target="_blank">Linux subsystem on Windows 10</a> (<a href="http://idioms.thefreedictionary.com/When+in+Rome" target="_blank">when in Rome</a>…).</p>
<p align="left"><strong>Only trick is</strong>, that isn’t a <em>app-get package</em> and we need Java 1.8 to run the files.&nbsp; <a href="https://tecadmin.net/install-oracle-java-8-ubuntu-via-ppa/" target="_blank">See Oracle’s instruction to install it properly</a>.&nbsp; There seems to have been a split between version 1.7 and 1.8 and the package for 1.7 doesn’t upgrade to 1.8.</p>
<h2 align="left">Using Gremlin on Cosmos DB</h2>
<p align="left">It is pretty straightforward by following the instructions.</p>
<p align="left">Only counterintuitive aspect is that we need to prefix every Gremlin command with <em>:&gt; </em>in order to access Cosmos DB (or any remote service in general from within Gremlin Console).</p>
<h2 align="left">Summary</h2>
<p align="left">Cosmos DB supports Gremlin as an interface to command &amp; query its graphs.</p>
<p align="left">This article was meant to simply list the links to quickly get started in that scenario.</p>