---
title:  Unit Testing SharePoint
date:  2012-12-01 00:26:00 +00:00
permalink:  "/2012/11/30/unit-testing-sharepoint/"
categories:
- Solution
tags:
- Office365
---
Doing automated unit tests in SharePoint isn’t easy.

As with all libraries that haven’t been designed with unit testing in mind, SharePoint object model doesn’t expose its dependencies:  it connects to a Content Database given the context creating it and there are no ways to redirect it to some stub implementations.

That is unless you can override method invocations.  This is what <a href="http://msdn.microsoft.com/en-us/library/hh549175.aspx">Visual Studio fakes</a> do.

Fakes allow a developer to create a stub out of a real object by rerouting calls to properties or methods.

For SharePoint, Microsoft just released <a href="http://blogs.msdn.com/b/visualstudioalm/archive/2012/11/26/introducing-sharepoint-emulators.aspx">SharePoint Emulators</a>, <em>a system of Fakes based shims implementing the basic behaviours of the SharePoint 2010 server object model</em>.

Developers can now use those shims to write unit tests on code using the SharePoint 2010 server object model.