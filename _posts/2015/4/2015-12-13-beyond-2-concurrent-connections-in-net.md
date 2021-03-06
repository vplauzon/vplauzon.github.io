---
title: Beyond 2 concurrent connections in .NET
date: 2015-12-13 16:00:44 -08:00
permalink: /2015/12/13/beyond-2-concurrent-connections-in-net/
categories:
- Solution
tags:
- .NET
---
I'm going to document this once and for all.
<h2>The Problem</h2>
<a href="/assets/posts/2015/4/beyond-2-concurrent-connections-in-net/ethernet-cable-icon1.png" rel="attachment wp-att-1392"><img class="size-full wp-image-1392 alignright" src="/assets/posts/2015/4/beyond-2-concurrent-connections-in-net/ethernet-cable-icon1.png" alt="Ethernet-Cable-icon[1]" width="128" height="128" /></a>You want to an endpoint multiple times in parallel. Or maybe you want to call multiple endpoints under the same domain name. For instance, you might want to drill an API with multiple requests because the API doesn't support batch mode.

The problem is that .NET, by default, supports only 2 TCP connections to the same IP address in parallel. If you async a bunch of web-calls, it's going to simply queue them and run them 2-by-2. So you won't scale much.

Sure this limit of two isn't hardcoded in .NET and you can change it, can't you!?
<h2>The Solution</h2>
<a href="/assets/posts/2015/4/beyond-2-concurrent-connections-in-net/business-parallel-tasks-icon1.png" rel="attachment wp-att-1394"><img class="size-full wp-image-1394 alignleft" src="/assets/posts/2015/4/beyond-2-concurrent-connections-in-net/business-parallel-tasks-icon1.png" alt="Business-Parallel-Tasks-icon[1]" width="128" height="128" /></a>Yes we can override that number.  It is driven by what is called the <em><a href="https://msdn.microsoft.com/en-us/library/system.net.servicepointmanager.aspx" target="_blank">Service Point Manager</a> </em>in <em>System.Net</em>.

There are two ways to override it:  by configuration or by code.  I would suggest to use the configuration route if your needs are static and by code if you need to change it given an input.
<h3>Configuration</h3>
Here's an example on how to override in in configuration:

```xml
<configuration>
 <system.net>
  <connectionManagement>
   <add address="myapi.com" maxconnection="12"/>
  </connectionManagement>
 </system.net>
</configuration>
```

Here I specify to have a maximum number of connections of <strong>12</strong> instead of 2 on the domain <em>myapi.com</em> only.

I could specify different rules for different domains:

```xml
<configuration>
 <system.net>
  <connectionManagement>
   <add address="myapi.com" maxconnection="12"/>
   <add address="yourapi.com" maxconnection="8"/>
   <add address="hisapi.com" maxconnection="4"/>
  </connectionManagement>
 </system.net>
</configuration>
```

Or I could do a blanket statement:

```xml
<configuration>
 <system.net>
  <connectionManagement>
   <add address="*" maxconnection="15"/>
  </connectionManagement>
 </system.net>
</configuration>
```

<h3>Configuration</h3>
In code, the easiest way is to do a blanket statement on all domains, using the static <a href="https://msdn.microsoft.com/en-us/library/system.net.servicepointmanager.defaultconnectionlimit.aspx" target="_blank">ServicePointManager.DefaultConnectionLimit property</a>:

```csharp
ServicePointManager.DefaultConnectionLimit = 15;
```

In order to go by domain, I would go through <a href="https://msdn.microsoft.com/en-us/library/system.net.servicepoint.aspx?f=255&amp;MSPPError=-2147217396" target="_blank">ServicePoint</a> objects, <strong>BUT I NEVER TRIED IT</strong>:

```csharp
var myApiServicePoint =
  ServicePointManager.FindServicePoint("myapi.com");

myApiServicePoint.ConnectionLimit = 12;

var yourApiServicePoint =
  ServicePointManager.FindServicePoint("yourapi.com");

yourApiServicePoint.ConnectionLimit = 8;

var hisApiServicePoint =
  ServicePointManager.FindServicePoint("hisapi.com");

hisApiServicePoint.ConnectionLimit = 4;
```

<h2>The Silver Bullet</h2>
Now that we have this solution, we feel all empowered, right?

I mean, we can now bombard our favorite APIs limitlessly.  Typically the heavy lifting is done on the API side so if we invoke APIs asynchronously, we can stream a lot of activity from a low-compute server, right?

The caveat is...  will the API let you?  If you hammer an API, there are two typical outcomes:
<ul>
 	<li>You're gona crash it</li>
 	<li>It's going to throttle you, or worse, it's going to black list you for a while a actively refuse your connections</li>
</ul>
Basically the second outcome is from an API owner that didn't want the first outcome to happened ;)

And I know it, because I've done it!  I've tried that trick on <a href="https://msdn.microsoft.com/en-us/library/azure/hh974476.aspx" target="_blank">Azure Active Directory Graph API</a> ; performance climbed for a few seconds then dropped drastically:  I got throttled.  Worse:  I got throttled for an hour.  For an entire hour the performance sucked because my IP got black listed.

I've done it with <a href="http://imdb.com" target="_blank">IMDB</a> last week.  I was trying to download its entire catalog by hitting every movie page using <a href="https://azure.microsoft.com/en-us/services/batch/" target="_blank">Azure Batch</a> and I got black listed (again!).

So be mindful about that and wield the connection limit sword carefully ;)

<a href="/assets/posts/2015/4/beyond-2-concurrent-connections-in-net/0d9bf61e081.jpg" rel="attachment wp-att-1402"><img class="alignnone size-full wp-image-1402" src="/assets/posts/2015/4/beyond-2-concurrent-connections-in-net/0d9bf61e081.jpg" alt="0D9BF61E08[1]" width="700" height="467" /></a>

&nbsp;