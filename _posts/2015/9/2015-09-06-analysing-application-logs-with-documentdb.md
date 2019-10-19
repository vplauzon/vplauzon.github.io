---
title:  Analysing Application Logs with DocumentDb
date:  2015-09-06 19:00:18 -04:00
permalink:  "/2015/09/06/analysing-application-logs-with-documentdb/"
categories:
- Solution
tags:
- Data
- NoSQL
---
<a href="/assets/2015/9/analysing-application-logs-with-documentdb/ic7912891.png"><img class="size-medium wp-image-1172 alignleft" src="/assets/2015/9/analysing-application-logs-with-documentdb/ic7912891.png?w=300" alt="IC791289[1]" width="300" height="204" /></a><a href="http://azure.microsoft.com/en-us/services/documentdb/">Azure DocumentDB</a> is Microsoft Document-centric NoSQL offering in the cloud.

I've been working with it since <a href="http://vincentlauzon.com/2014/09/08/azure-documentdb-first-use-cases/">Septembre 2014</a> and I wanted to share a use case I found it really good at:  log analysis.

Now that takes some context.

&nbsp;

I have been working for a customer using Microsoft Azure as a development Platform.  Applications were C# Web Apps and the logs were done using the standard .NET tracing capture by Azure to blob storage.

As with most applications, logging was in the backseat while applications were developed so developers would sprinkle lines such as:

<span style="font-family:Consolas;font-size:small;">System.Diagnostics.</span><span style="color:#2b91af;font-family:Consolas;font-size:small;">Trace</span><span style="font-family:Consolas;font-size:small;">.TraceError(</span><span style="color:#a31515;font-family:Consolas;font-size:small;">"Service X was not available"</span><span style="font-family:Consolas;font-size:small;">);</span>

Mind you, that's better than my contribution, which typically has no logs at all except for a catch all in the outer-most scope so you can be informed that there has been a null exception somewhere!

I've architected quite a few systems and often end up troubleshooting issues in production environments, either functional or performance based.  Without good logs, that is impossible.

The problem I always found with text logs is they are so difficult to exploit.  Once you have a few megs of one-liners, they end-up being useless.  They lack two things:
<ul>
	<li>Standard information</li>
	<li>Structure</li>
</ul>
Standard information examples?  Event name, correlation-ID, duration, exception, etc.  Because they are standard through your log, they are easier to search.

Structure?  Well, structure enables you to search more easily as well.  When a developer splits information blocks by comma, another one by pipes, etc.  it doesn't simplify the consumption of logs.

&nbsp;

More robust logging solutions do implement those two aspects.  For instance, <a href="https://msdn.microsoft.com/en-us/library/dn440729(v=pandp.60).aspx" target="_blank">Enterprise Library Semantic Logging</a> implements custom EventSource being <em>semantic</em>, i.e. have strong typing.  This is borrowed from <a href="https://msdn.microsoft.com/en-us/library/ms751538(v=vs.110).aspx" target="_blank">Windows ETW Tracing</a>.

Now the constrain I had was to use the basic .NET tracing and to log in the blob storage.

<a href="http://json.org/"><img class="alignright wp-image-1176 size-full" src="/assets/2015/9/analysing-application-logs-with-documentdb/json1601.gif" alt="JSON" width="160" height="160" /></a>

What I did is that I separated the problem of logging and the problem of analysing the logs:  I did log strong typed JSON events serialized as a string into the .NET trace.

.NET only saw strings and was happy.

But I had structured and standard information into JSON objects.  Better yet, I didn't have the same type of JSON objects everywhere.  This allowed me, for instance, to log controller interception with an information subset, method calls with another and errors with yet another.

You must see me coming by now...  DocumentDB was the perfect tool to analyse that data.  All I had to do was to write some code to load CSV files from the blob storage to a DocumentDB collection.

The way I did that was to take each row in CSV files and considered them as a JSON object with the 'message' column being a complex field in the JSON object (i.e. yet another JSON object).

Then I could analyse the logs by simply doing DocumentDB-SQL queries.  Since the documents were already fully indexed, the queries were instantaneous!

&nbsp;

This was a life saver on the different projects I used that approach.  I could dive in massive amount of logs easily, get information, compile statistics, detect outlyers, etc.  .

I actually bundled all that in a web solution that was able to import data from a blob container, have some interactive queries and also allow the export of query results to CSV files so I could analyse further in Excel.

&nbsp;

In a way this borrows a lot of patterns from Big Data:
<ul>
	<li>Store your unprocessed data in a data lake, in this case blobs</li>
	<li>Load your data in structured form only for analysis (schema on read)</li>
	<li>Extract insights</li>
	<li>Drop the structured form</li>
</ul>
&nbsp;

This allowed me to learn a lot more about DocumentDB.  I hit the ingestion limits of the S1 tier pretty quickly even by bundling records together using a stored procedure and had to implement back-offs.  When I got too aggressive creating / deleting collections, I got trottled and the service refused to serve me.

But otherwise, the query speed was really excellent.  Being able to dive in JSON ojects in query is a huge enabler.