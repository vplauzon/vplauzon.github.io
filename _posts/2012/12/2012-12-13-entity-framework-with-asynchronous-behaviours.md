---
title: Entity Framework with Asynchronous behaviours
date: 2012-12-13 18:46:00 -05:00
permalink: /2012/12/13/entity-framework-with-asynchronous-behaviours/
categories:
- Solution
tags:
- .NET
- Data
---
<p>They finally did it:&#160; the future release of Entity Framework (version 6) <a href="http://msdn.microsoft.com/en-us/data/jj819165">will sport asynchronous behaviour</a> based on .NET 4.0 Task Parallel Library (TPL).</p>  <p>The API is pretty neat.&#160; First the <em>SaveChanges</em> gets an async brother <em>SaveChangesAsync</em> returning a <a href="http://msdn.microsoft.com/en-us/library/system.threading.tasks.task.aspx">Task</a>.&#160; So we can now write things like:</p>  <blockquote>   <p>await context.SavesChangesAsync();</p> </blockquote>  <p>The more complicated topic is the queries.&#160; LINQ was designed before TPL and doesn’t have the notion of asynchrony.&#160; They got around it in a clever fashion:&#160; LINQ describe the queries while EF allows you to enumerate the result in an asynchronous fashion:</p>  <blockquote>   <p>var q = from e in context.Employees</p>    <p>&#160; where e.Name.StartsWith(&quot;V&quot;)</p>    <p>&#160; select e;</p>    <p>&#160;</p>    <p>await q.ForEachAsync(e =&gt; Console.WriteLine(e.FirstName));</p> </blockquote>  <p>So the entire enumeration is done asynchronously hence Entity Framework can manage the moment when it needs to fetch the DB for new objects.</p>  <p>This new feature is quite powerful since DB access is typically a place where your thread blocks, waiting for something external.&#160; For instance, a web service doing a query and returning data is typically written synchronously with the thread blocking waiting for the DB server.&#160; Using this new asynchronous mode, we can as easily write an asynchronous version, much more scalable since no threads are blocking, hence more thread can be used to process requests.</p>