---
title:  Windows Store App Lifecycle
date:  2012-10-24 20:22:00 -04:00
permalink:  "/2012/10/24/windows-store-app-lifecycle/"
categories:
- Solution
tags:
- .NET
---
<p>MSDN Magazine <a href="http://msdn.microsoft.com/en-us/magazine/jj660301.aspx">cool article</a> about Windows Store App (aka Modern App, aka Metro Style app) lifecycle.</p>  <p>The author, Rachel Appel, raise the veil from how an app is managed by the OS in Windows 8.</p>  <p>Actually there are few states for an application to be in and few transitions but the devil is in the details!</p>  <p><img title="How Windows Store Apps Move Between Execution States" alt="How Windows Store Apps Move Between Execution States" src="http://i.msdn.microsoft.com/jj660301.Appel_Figure1_hires(en-us,MSDN.10).jpg" /></p>  <p>For instance, your app may get <em>terminated </em>without the user closing it.&#160; This would be done after the OS <em>suspend</em> it but when your app is launched again, it would need to behave as if it got back from the <em>suspended</em> state and recover all its runtime state from durable storage.&#160; That easier said than done and this is where the app designer has a major role to play!</p>