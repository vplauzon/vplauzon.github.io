---
title: Azure Application Insights Role Name Nuget Package
date: 2019-01-23 03:30:06 -08:00
permalink: /2019/01/23/azure-application-insights-role-name-nuget-package/
categories:
- Solution
tags:
- DevOps
- Web
---
<img style="float:left;padding-right:20px;" title="From Pexels" src="/assets/posts/2019/1/azure-application-insights-role-name-nuget-package/beads-blur-bright-1208091-e1543604741902.jpg" />

I've been using <a href="https://docs.microsoft.com/en-us/azure/application-insights/app-insights-overview">Azure Application Insights</a> to monitor micro-services.

Since I have many micro-services, it isn't practical to have an Application Insight resource per service.  Given that those micro-services interact with each other and I want to monitor those interactions, it makes sense to get all telemetry in one place.

The issue with that is to isolate the telemetry of each service when I want to gain insights on one service at the time.

The <a href="https://docs.microsoft.com/en-us/azure/application-insights/app-insights-monitor-multi-role-apps">general guidance</a> is to set the <em>cloud_RoleName</em> property on telemetry.  That property is used by <a href="https://docs.microsoft.com/en-us/azure/application-insights/app-insights-app-map">Application Map</a>, among other things, to single out applications.

In order to do that with the .NET SDK, it is recommended to use <em>Telemetry Initializer</em>.

Implementing that in each of my micro-service is repetitive so I built the shared logic in a <a href="https://www.nuget.org/packages/AppInsights.TelemetryInitializers/">Nuget Package</a>.

Here I'll talk about the package, its implementation &amp; how to use it.

The <a href="https://github.com/vplauzon/AppInsights.TelemetryInitializers">code for the package is on GitHub</a>.

<h2>Using the Nuget Package</h2>

Using the package is quite straightforward:

<ol>
<li>Install <a href="https://www.nuget.org/packages/AppInsights.TelemetryInitializers/">the package</a></li>
<li>Add instrumentation key in the appsettings.json</li>
<li>Add <code>UseApplicationInsights</code> on the web-host</li>
<li>Add <code>RoleNameInitializer</code> to the telemetry initializers list</li>
</ol>

A few of those steps are done automatically when <a href="https://docs.microsoft.com/en-us/azure/application-insights/app-insights-asp-net#ide">we use the <em>Configure Application Insights</em> wizard</a>.  As always, we prefer knowing what is going on.  We'll therefore refrain from wizardry.

<h3>Install the package</h3>

This one is trivial.

It is interesting to note that the package will bring the following package with it:

<ul>
<li>Microsoft.ApplicationInsights.AspNetCore (Application Insights SDK)</li>
<li>Microsoft.AspNetCore.Http.Abstractions</li>
</ul>

<h3>Add instrumentation key in the appsettings.json</h3>

The <em>appsettings.json</em> file should look like this:

```JavaScript
{
  "Logging": {
    "IncludeScopes": false,
    "LogLevel": {
      "Default": "Warning"
    }
  },
  "ApplicationInsights": {
    "InstrumentationKey": "<MY KEY>"
  }
}
```

The important part is the <em>ApplicationInsights</em> section.  The instrumentation key is found in the overview pane:

<img src="/assets/posts/2019/1/azure-application-insights-role-name-nuget-package/instrumentation-key.png" alt="Instrumentation Key" />

<h3>Add UseApplicationInsights on the web-host</h3>

Typically, the <em>Web Host</em> is initialized in the <em>Program.cs</em> file.  We should add <code>UseApplicationInsights</code> there, so it looks like this:

```csharp
public static IWebHost BuildWebHost(string[] args) =>
    WebHost.CreateDefaultBuilder(args)
        .UseApplicationInsights()
        .UseStartup<Startup>()
        .Build();
```

Optionally the <em>instrumentation key</em> can be passed in parameter to that method.

<h3>Add RoleNameInitializer to the telemetry initializers list</h3>

Now, inside the <code>Startup.Configure</code> object, we need to add:

```csharp
TelemetryConfiguration.Active.TelemetryInitializers.Add(new RoleNameInitializer("<MY SERVICE NAME>"));
```

<code>TelemetryConfiguration.Active.TelemetryInitializers</code> belongs to the Microsoft Application Insights' SDK while <code>RoleNameInitializer</code> belongs to our Nuget Package.

The mechanic of telemetry initializers is they are called one after the other with a telemetry object.  They can then alter the telemetry object.

That's it.  Our telemetry should now be tagged with our service name.

<h2>Result in App Insights</h2>

We can see our telemetries is now segmented by role name.  For instance, if we query:

```text
requests |
distinct cloud_RoleName
```

We should see our service name in there.

This is true for all telemetry in the application (e.g. custom events).

<h2>Implementation</h2>

The implementation, i.e. the <a href="https://github.com/vplauzon/AppInsights.TelemetryInitializers">code of the NuGet Package</a> is quite simple.

It boils down to one class, <a href="https://github.com/vplauzon/AppInsights.TelemetryInitializers/blob/master/AppInsights.TelemetryInitializers/RoleNameInitializer.cs">RoleNameInitializer</a>:

```csharp
/// <summary>Add a cloud role name to the context of every telemetries.</summary>
/// <remarks>
/// This allows to monitor multiple components and discriminate betweeen components.
/// See https://docs.microsoft.com/en-us/azure/application-insights/app-insights-monitor-multi-role-apps.
/// </remarks>
public class RoleNameInitializer : ITelemetryInitializer
{
    private readonly string _roleName;

    /// <summary>Construct an initializer with a role name.</summary>
    /// <param name="roleName">Cloud role name to assign to telemetry's context.</param>
    public RoleNameInitializer(string roleName)
    {
        if(string.IsNullOrWhiteSpace(roleName))
        {
            throw new ArgumentNullException(nameof(roleName));
        }

        _roleName = roleName;
    }

    void ITelemetryInitializer.Initialize(ITelemetry telemetry)
    {
        telemetry.Context.Cloud.RoleName = _roleName;
    }
}
```

The key is the initialize method.  As mentioned above, this is called by the Microsoft Application Insights SDK on each telemetry.

Here we simply set the cloud role name.

<h2>Bonus feature:  logging request body</h2>

Another telemetry initializer is implemented in the Nuget package:  <a href="https://github.com/vplauzon/AppInsights.TelemetryInitializers/blob/master/AppInsights.TelemetryInitializers/RequestBodyInitializer.cs">RequestBodyInitializer</a>.

This initializer captures the body of a request.  It needs to be used with care as it could use a lot of resources depending on request sizes.

This was based on a <a href="https://stackoverflow.com/questions/42686363/view-post-request-body-in-application-insights">Stack overflow article</a>.

It is a little trickier to use as it takes a <code>IHttpContextAccessor</code> in parameter.  Thankfully, that component is dependency injected in ASP.NET core.

We therefore recommend adding the component to the services:

```csharp
public class Startup
{
    //  ...

    // This method gets called by the runtime. Use this method to add services to the container.
    public void ConfigureServices(IServiceCollection services)
    {
        // ...
        services.AddTransient<RequestBodyInitializer, RequestBodyInitializer>();
    }
```

This way, when it is constructed, it will get an <code>IHttpContextAccessor</code>.

We can then add it as a parameter to the <code>Configure</code> method and finally add it to the telemetry initializers list:

```csharp
public void Configure(
    IApplicationBuilder app,
    IHostingEnvironment env,
    RequestBodyInitializer requestBodyInitializer)
{
    //  ...
    TelemetryConfiguration.Active.TelemetryInitializers.Add(new RoleNameInitializer("PasApi"));
    TelemetryConfiguration.Active.TelemetryInitializers.Add(requestBodyInitializer);

```

**UPDATE 08-20-2021:  `TelemetryConfiguration.Active` has [actually been deprecated](https://github.com/microsoft/ApplicationInsights-dotnet/issues/1152).  The new mechanism is to use `services.AddSingleton<ITelemetryInitializer>(new RoleNameInitializer("my-service-name"))`.  Thank you [Joan](https://github.com/JoanComasFdz) for bringing that to our attention!**

<h2>Summary</h2>

Changing the cloud role name isn't rocket science but it can be repetitive.

We created a <a href="https://www.nuget.org/packages/AppInsights.TelemetryInitializers/">Nuget package to simplify that</a>.

We hope that can be useful to any of you out there.