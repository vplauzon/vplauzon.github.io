---
title:  Creating an image with 2 Managed Disks for VM Scale Set
date:  2017-02-23 16:00:59 +00:00
permalink:  "/2017/02/23/creating-an-image-with-2-managed-disks-for-vm-scale-set/"
categories:
- Solution
tags:
- Automation
- Virtual Machines
---
<strong>UPDATE (23-06-2017):  Fabio Hara, a colleague of mine from Brazil, has published the ARM template on <a href="https://github.com/fabioharams/VMSS-Custom-Windows-Managed-Disk">his GitHub</a>.  This makes it much easier to try the content of this article.  Thank you Fabio!</strong>

We talked about <a href="http://vincentlauzon.com/2017/02/20/azure-managed-disk-overview/">Managed Disks</a>, now let's use them.

Let’s create an image from an OS + Data disk &amp; create a Scale Set with that image.
<h3>Deploy ARM Template</h3>

[code language="JavaScript"]
{
  &quot;$schema&quot;: &quot;https://schema.management.azure.com/schemas/2015-01-01/deploymentTemplate.json#&quot;,
  &quot;contentVersion&quot;: &quot;1.0.0.0&quot;,
  &quot;parameters&quot;: {
    &quot;VM Admin User Name&quot;: {
      &quot;defaultValue&quot;: &quot;myadmin&quot;,
      &quot;type&quot;: &quot;string&quot;
    },
    &quot;VM Admin Password&quot;: {
      &quot;defaultValue&quot;: null,
      &quot;type&quot;: &quot;securestring&quot;
    },
    &quot;VM Size&quot;: {
      &quot;defaultValue&quot;: &quot;Standard_DS4&quot;,
      &quot;type&quot;: &quot;string&quot;,
      &quot;allowedValues&quot;: [
        &quot;Standard_DS1&quot;,
        &quot;Standard_DS2&quot;,
        &quot;Standard_DS3&quot;,
        &quot;Standard_DS4&quot;,
        &quot;Standard_DS5&quot;
      ],
      &quot;metadata&quot;: {
        &quot;description&quot;: &quot;SKU of the VM.&quot;
      }
    },
    &quot;Public Domain Label&quot;: {
      &quot;type&quot;: &quot;string&quot;
    }
  },
  &quot;variables&quot;: {
    &quot;Vhds Container Name&quot;: &quot;vhds&quot;,
    &quot;frontIpRange&quot;: &quot;10.0.1.0/24&quot;,
    &quot;Public IP Name&quot;: &quot;MyPublicIP&quot;,
    &quot;Public LB Name&quot;: &quot;PublicLB&quot;,
    &quot;Front Address Pool Name&quot;: &quot;frontPool&quot;,
    &quot;Front NIC&quot;: &quot;frontNic&quot;,
    &quot;Front VM&quot;: &quot;Demo-VM&quot;,
    &quot;Front Availability Set Name&quot;: &quot;frontAvailSet&quot;,
    &quot;Private LB Name&quot;: &quot;PrivateLB&quot;,
    &quot;VNET Name&quot;: &quot;Demo-VNet&quot;
  },
  &quot;resources&quot;: [
    {
      &quot;type&quot;: &quot;Microsoft.Network/publicIPAddresses&quot;,
      &quot;name&quot;: &quot;[variables('Public IP Name')]&quot;,
      &quot;apiVersion&quot;: &quot;2015-06-15&quot;,
      &quot;location&quot;: &quot;[resourceGroup().location]&quot;,
      &quot;tags&quot;: {
        &quot;displayName&quot;: &quot;Public IP&quot;
      },
      &quot;properties&quot;: {
        &quot;publicIPAllocationMethod&quot;: &quot;Dynamic&quot;,
        &quot;idleTimeoutInMinutes&quot;: 4,
        &quot;dnsSettings&quot;: {
          &quot;domainNameLabel&quot;: &quot;[parameters('Public Domain Label')]&quot;
        }
      }
    },
    {
      &quot;type&quot;: &quot;Microsoft.Network/virtualNetworks&quot;,
      &quot;name&quot;: &quot;[variables('VNet Name')]&quot;,
      &quot;apiVersion&quot;: &quot;2016-03-30&quot;,
      &quot;location&quot;: &quot;[resourceGroup().location]&quot;,
      &quot;properties&quot;: {
        &quot;addressSpace&quot;: {
          &quot;addressPrefixes&quot;: [
            &quot;10.0.0.0/16&quot;
          ]
        },
        &quot;subnets&quot;: [
          {
            &quot;name&quot;: &quot;front&quot;,
            &quot;properties&quot;: {
              &quot;addressPrefix&quot;: &quot;[variables('frontIpRange')]&quot;,
              &quot;networkSecurityGroup&quot;: {
                &quot;id&quot;: &quot;[resourceId('Microsoft.Network/networkSecurityGroups', 'frontNsg')]&quot;
              }
            }
          }
        ]
      },
      &quot;resources&quot;: [],
      &quot;dependsOn&quot;: [
        &quot;[resourceId('Microsoft.Network/networkSecurityGroups', 'frontNsg')]&quot;
      ]
    },
    {
      &quot;type&quot;: &quot;Microsoft.Network/loadBalancers&quot;,
      &quot;name&quot;: &quot;[variables('Public LB Name')]&quot;,
      &quot;apiVersion&quot;: &quot;2015-06-15&quot;,
      &quot;location&quot;: &quot;[resourceGroup().location]&quot;,
      &quot;tags&quot;: {
        &quot;displayName&quot;: &quot;Public Load Balancer&quot;
      },
      &quot;properties&quot;: {
        &quot;frontendIPConfigurations&quot;: [
          {
            &quot;name&quot;: &quot;LoadBalancerFrontEnd&quot;,
            &quot;comments&quot;: &quot;Front end of LB:  the IP address&quot;,
            &quot;properties&quot;: {
              &quot;publicIPAddress&quot;: {
                &quot;id&quot;: &quot;[resourceId('Microsoft.Network/publicIPAddresses/', variables('Public IP Name'))]&quot;
              }
            }
          }
        ],
        &quot;backendAddressPools&quot;: [
          {
            &quot;name&quot;: &quot;[variables('Front Address Pool Name')]&quot;
          }
        ],
        &quot;loadBalancingRules&quot;: [
          {
            &quot;name&quot;: &quot;Http&quot;,
            &quot;properties&quot;: {
              &quot;frontendIPConfiguration&quot;: {
                &quot;id&quot;: &quot;[concat(resourceId('Microsoft.Network/loadBalancers', variables('Public LB Name')), '/frontendIPConfigurations/LoadBalancerFrontEnd')]&quot;
              },
              &quot;frontendPort&quot;: 80,
              &quot;backendPort&quot;: 80,
              &quot;enableFloatingIP&quot;: false,
              &quot;idleTimeoutInMinutes&quot;: 4,
              &quot;protocol&quot;: &quot;Tcp&quot;,
              &quot;loadDistribution&quot;: &quot;Default&quot;,
              &quot;backendAddressPool&quot;: {
                &quot;id&quot;: &quot;[concat(resourceId('Microsoft.Network/loadBalancers', variables('Public LB Name')), '/backendAddressPools/', variables('Front Address Pool Name'))]&quot;
              },
              &quot;probe&quot;: {
                &quot;id&quot;: &quot;[concat(resourceId('Microsoft.Network/loadBalancers', variables('Public LB Name')), '/probes/TCP-Probe')]&quot;
              }
            }
          }
        ],
        &quot;probes&quot;: [
          {
            &quot;name&quot;: &quot;TCP-Probe&quot;,
            &quot;properties&quot;: {
              &quot;protocol&quot;: &quot;Tcp&quot;,
              &quot;port&quot;: 80,
              &quot;intervalInSeconds&quot;: 5,
              &quot;numberOfProbes&quot;: 2
            }
          }
        ],
        &quot;inboundNatRules&quot;: [
          {
            &quot;name&quot;: &quot;SSH-2-Primary&quot;,
            &quot;properties&quot;: {
              &quot;frontendIPConfiguration&quot;: {
                &quot;id&quot;: &quot;[concat(resourceId('Microsoft.Network/loadBalancers', variables('Public LB Name')), '/frontendIPConfigurations/LoadBalancerFrontEnd')]&quot;
              },
              &quot;frontendPort&quot;: 22,
              &quot;backendPort&quot;: 22,
              &quot;protocol&quot;: &quot;Tcp&quot;
            }
          }
        ],
        &quot;outboundNatRules&quot;: [],
        &quot;inboundNatPools&quot;: []
      },
      &quot;dependsOn&quot;: [
        &quot;[resourceId('Microsoft.Network/publicIPAddresses', variables('Public IP Name'))]&quot;
      ]
    },
    {
      &quot;apiVersion&quot;: &quot;2015-06-15&quot;,
      &quot;name&quot;: &quot;frontNsg&quot;,
      &quot;type&quot;: &quot;Microsoft.Network/networkSecurityGroups&quot;,
      &quot;location&quot;: &quot;[resourceGroup().location]&quot;,
      &quot;tags&quot;: {},
      &quot;properties&quot;: {
        &quot;securityRules&quot;: [
          {
            &quot;name&quot;: &quot;Allow-SSH-From-Everywhere&quot;,
            &quot;properties&quot;: {
              &quot;protocol&quot;: &quot;Tcp&quot;,
              &quot;sourcePortRange&quot;: &quot;*&quot;,
              &quot;destinationPortRange&quot;: &quot;22&quot;,
              &quot;sourceAddressPrefix&quot;: &quot;*&quot;,
              &quot;destinationAddressPrefix&quot;: &quot;*&quot;,
              &quot;access&quot;: &quot;Allow&quot;,
              &quot;priority&quot;: 100,
              &quot;direction&quot;: &quot;Inbound&quot;
            }
          },
          {
            &quot;name&quot;: &quot;Allow-Health-Monitoring&quot;,
            &quot;properties&quot;: {
              &quot;protocol&quot;: &quot;*&quot;,
              &quot;sourcePortRange&quot;: &quot;*&quot;,
              &quot;destinationPortRange&quot;: &quot;*&quot;,
              &quot;sourceAddressPrefix&quot;: &quot;AzureLoadBalancer&quot;,
              &quot;destinationAddressPrefix&quot;: &quot;*&quot;,
              &quot;access&quot;: &quot;Allow&quot;,
              &quot;priority&quot;: 200,
              &quot;direction&quot;: &quot;Inbound&quot;
            }
          },
          {
            &quot;name&quot;: &quot;Disallow-everything-else-Inbound&quot;,
            &quot;properties&quot;: {
              &quot;protocol&quot;: &quot;*&quot;,
              &quot;sourcePortRange&quot;: &quot;*&quot;,
              &quot;destinationPortRange&quot;: &quot;*&quot;,
              &quot;sourceAddressPrefix&quot;: &quot;*&quot;,
              &quot;destinationAddressPrefix&quot;: &quot;*&quot;,
              &quot;access&quot;: &quot;Deny&quot;,
              &quot;priority&quot;: 300,
              &quot;direction&quot;: &quot;Inbound&quot;
            }
          },
          {
            &quot;name&quot;: &quot;Allow-to-VNet&quot;,
            &quot;properties&quot;: {
              &quot;protocol&quot;: &quot;*&quot;,
              &quot;sourcePortRange&quot;: &quot;*&quot;,
              &quot;destinationPortRange&quot;: &quot;*&quot;,
              &quot;sourceAddressPrefix&quot;: &quot;*&quot;,
              &quot;destinationAddressPrefix&quot;: &quot;VirtualNetwork&quot;,
              &quot;access&quot;: &quot;Allow&quot;,
              &quot;priority&quot;: 100,
              &quot;direction&quot;: &quot;Outbound&quot;
            }
          },
          {
            &quot;name&quot;: &quot;Allow-to-8443&quot;,
            &quot;properties&quot;: {
              &quot;protocol&quot;: &quot;*&quot;,
              &quot;sourcePortRange&quot;: &quot;*&quot;,
              &quot;destinationPortRange&quot;: &quot;8443&quot;,
              &quot;sourceAddressPrefix&quot;: &quot;*&quot;,
              &quot;destinationAddressPrefix&quot;: &quot;Internet&quot;,
              &quot;access&quot;: &quot;Allow&quot;,
              &quot;priority&quot;: 200,
              &quot;direction&quot;: &quot;Outbound&quot;
            }
          },
          {
            &quot;name&quot;: &quot;Disallow-everything-else-Outbound&quot;,
            &quot;properties&quot;: {
              &quot;protocol&quot;: &quot;*&quot;,
              &quot;sourcePortRange&quot;: &quot;*&quot;,
              &quot;destinationPortRange&quot;: &quot;*&quot;,
              &quot;sourceAddressPrefix&quot;: &quot;*&quot;,
              &quot;destinationAddressPrefix&quot;: &quot;*&quot;,
              &quot;access&quot;: &quot;Deny&quot;,
              &quot;priority&quot;: 300,
              &quot;direction&quot;: &quot;Outbound&quot;
            }
          }
        ],
        &quot;subnets&quot;: []
      }
    },
    {
      &quot;type&quot;: &quot;Microsoft.Network/networkInterfaces&quot;,
      &quot;name&quot;: &quot;[variables('Front NIC')]&quot;,
      &quot;tags&quot;: {
        &quot;displayName&quot;: &quot;Front NICs&quot;
      },
      &quot;apiVersion&quot;: &quot;2016-03-30&quot;,
      &quot;location&quot;: &quot;[resourceGroup().location]&quot;,
      &quot;properties&quot;: {
        &quot;ipConfigurations&quot;: [
          {
            &quot;name&quot;: &quot;ipconfig&quot;,
            &quot;properties&quot;: {
              &quot;privateIPAllocationMethod&quot;: &quot;Dynamic&quot;,
              &quot;subnet&quot;: {
                &quot;id&quot;: &quot;[concat(resourceId('Microsoft.Network/virtualNetworks', variables('VNet Name')), '/subnets/front')]&quot;
              },
              &quot;loadBalancerBackendAddressPools&quot;: [
                {
                  &quot;id&quot;: &quot;[concat(resourceId('Microsoft.Network/loadBalancers', variables('Public LB Name')), '/backendAddressPools/', variables('Front Address Pool Name'))]&quot;
                }
              ],
              &quot;loadBalancerInboundNatRules&quot;: [
                {
                  &quot;id&quot;: &quot;[concat(resourceId('Microsoft.Network/loadBalancers', variables('Public LB Name')), '/inboundNatRules/SSH-2-Primary')]&quot;
                }
              ]
            }
          }
        ],
        &quot;dnsSettings&quot;: {
          &quot;dnsServers&quot;: []
        },
        &quot;enableIPForwarding&quot;: false
      },
      &quot;resources&quot;: [],
      &quot;dependsOn&quot;: [
        &quot;[resourceId('Microsoft.Network/virtualNetworks', variables('VNet Name'))]&quot;,
        &quot;[resourceId('Microsoft.Network/loadBalancers', variables('Public LB Name'))]&quot;
      ]
    },
    {
      &quot;type&quot;: &quot;Microsoft.Compute/disks&quot;,
      &quot;name&quot;: &quot;[concat(variables('Front VM'), '-data')]&quot;,
      &quot;apiVersion&quot;: &quot;2016-04-30-preview&quot;,
      &quot;location&quot;: &quot;[resourceGroup().location]&quot;,
      &quot;properties&quot;: {
        &quot;creationData&quot;: {
          &quot;createOption&quot;: &quot;Empty&quot;
        },
        &quot;accountType&quot;: &quot;Premium_LRS&quot;,
        &quot;diskSizeGB&quot;: 32
      }
    },
    {
      &quot;type&quot;: &quot;Microsoft.Compute/virtualMachines&quot;,
      &quot;name&quot;: &quot;[variables('Front VM')]&quot;,
      &quot;tags&quot;: {
        &quot;displayName&quot;: &quot;Front VMs&quot;
      },
      &quot;apiVersion&quot;: &quot;2016-04-30-preview&quot;,
      &quot;location&quot;: &quot;[resourceGroup().location]&quot;,
      &quot;properties&quot;: {
        &quot;availabilitySet&quot;: {
          &quot;id&quot;: &quot;[resourceId('Microsoft.Compute/availabilitySets', variables('Front Availability Set Name'))]&quot;
        },
        &quot;hardwareProfile&quot;: {
          &quot;vmSize&quot;: &quot;[parameters('VM Size')]&quot;
        },
        &quot;storageProfile&quot;: {
          &quot;imageReference&quot;: {
            &quot;publisher&quot;: &quot;OpenLogic&quot;,
            &quot;offer&quot;: &quot;CentOS&quot;,
            &quot;sku&quot;: &quot;7.3&quot;,
            &quot;version&quot;: &quot;latest&quot;
          },
          &quot;osDisk&quot;: {
            &quot;name&quot;: &quot;[variables('Front VM')]&quot;,
            &quot;createOption&quot;: &quot;FromImage&quot;,
            &quot;caching&quot;: &quot;ReadWrite&quot;
          },
          &quot;dataDisks&quot;: [
            {
              &quot;lun&quot;: 2,
              &quot;name&quot;: &quot;[concat(variables('Front VM'), '-data')]&quot;,
              &quot;createOption&quot;: &quot;attach&quot;,
              &quot;managedDisk&quot;: {
                &quot;id&quot;: &quot;[resourceId('Microsoft.Compute/disks', concat(variables('Front VM'), '-data'))]&quot;
              },
              &quot;caching&quot;: &quot;Readonly&quot;
            }
          ]
        },
        &quot;osProfile&quot;: {
          &quot;computerName&quot;: &quot;[variables('Front VM')]&quot;,
          &quot;adminUsername&quot;: &quot;[parameters('VM Admin User Name')]&quot;,
          &quot;adminPassword&quot;: &quot;[parameters('VM Admin Password')]&quot;
        },
        &quot;networkProfile&quot;: {
          &quot;networkInterfaces&quot;: [
            {
              &quot;id&quot;: &quot;[resourceId('Microsoft.Network/networkInterfaces', variables('Front NIC'))]&quot;
            }
          ]
        }
      },
      &quot;resources&quot;: [],
      &quot;dependsOn&quot;: [
        &quot;[resourceId('Microsoft.Network/networkInterfaces', variables('Front NIC'))]&quot;,
        &quot;[resourceId('Microsoft.Compute/availabilitySets', variables('Front Availability Set Name'))]&quot;,
        &quot;[resourceId('Microsoft.Compute/disks', concat(variables('Front VM'), '-data'))]&quot;
      ]
    },
    {
      &quot;name&quot;: &quot;[variables('Front Availability Set Name')]&quot;,
      &quot;type&quot;: &quot;Microsoft.Compute/availabilitySets&quot;,
      &quot;location&quot;: &quot;[resourceGroup().location]&quot;,
      &quot;apiVersion&quot;: &quot;2016-04-30-preview&quot;,
      &quot;tags&quot;: {
        &quot;displayName&quot;: &quot;FrontAvailabilitySet&quot;
      },
      &quot;properties&quot;: {
        &quot;platformUpdateDomainCount&quot;: 5,
        &quot;platformFaultDomainCount&quot;: 3,
        &quot;managed&quot;: true
      },
      &quot;dependsOn&quot;: []
    }
  ]
}
[/code]

<ol>
 	<li>We use the resource group named <i>md-demo-image</i></li>
 	<li>This deploys a single Linux VM into a managed availability set using a premium managed disk</li>
 	<li>The VM has both OS &amp; a data disk</li>
 	<li>The deployment <b>takes a few minutes</b></li>
</ol>
<h3>Customize VM</h3>
<ol>
 	<li>Login to the VM</li>
</ol>
<ol>
 	<li>We suggest using Putty tool with SSH (SSH port is opened on NSG)</li>
 	<li>Look at <i>MyPublicIP </i>to find the DNS of the public IP in order to SSH to it</li>
</ol>
<ul>
 	<li>First, let’s initialize the data disk by using the procedure described in <a href="https://docs.microsoft.com/en-ca/azure/virtual-machines/linux/add-disk#connect-to-the-linux-vm-to-mount-the-new-disk">https://docs.microsoft.com/en-ca/azure/virtual-machines/linux/add-disk#connect-to-the-linux-vm-to-mount-the-new-disk</a></li>
</ul>
<ol>
 	<li>The data disk is LUN-2 (it should be /dev/sdc)</li>
 	<li>We will mount it to /data</li>
 	<li>Write the mount point permanently in /etc/fstab</li>
</ol>
<ul>
 	<li>In the bash shell, type
cd /data
sudo touch mydata
ls</li>
 	<li>We just created a file on the data disk</li>
</ul>
<h3>Login into ISE</h3>
<ol>
 	<li>Open up PowerShell ISE</li>
 	<li>Type Add-AzureRmAccount</li>
 	<li>Enter your credentials ; those credentials should be the same you are using to log into the Azure Portal</li>
 	<li>If you have more than one subscriptions</li>
</ol>
<ol>
 	<li>Type Get-AzureRmSubscription</li>
 	<li>This should list all subscriptions you have access (even partial) to</li>
 	<li>Select the <i>SubscriptionId</i> (a GUID) of the subscription you want to use</li>
 	<li>Type Select-AzureRmSubscription -SubscriptionId &lt;SubscriptionId&gt;
<i>&lt;SubscriptionId&gt;</i> is the value you just selected</li>
 	<li>This will select the specified subscription as the “current one”, i.e. future queries will be done against that subscription</li>
</ol>
<h3>Create Image</h3>
You can read about details of this procedure at <a href="https://docs.microsoft.com/en-us/azure/virtual-machines/virtual-machines-linux-capture-image">https://docs.microsoft.com/en-us/azure/virtual-machines/virtual-machines-linux-capture-image</a> &amp; <a href="https://docs.microsoft.com/en-us/azure/virtual-machines/virtual-machines-windows-capture-image-resource">https://docs.microsoft.com/en-us/azure/virtual-machines/virtual-machines-windows-capture-image-resource</a>.
<ol>
 	<li>In bash shell, type
sudo waagent -deprovision+user -force</li>
 	<li>This de-provisions the VM itself</li>
 	<li>In PowerShell, type
$rgName = "md-demo-image"
$imageName = "Demo-VM-Image"
$vm = Get-AzureRmVM -ResourceGroupName $rgName
Stop-AzureRmVM -ResourceGroupName $rgName -Name $vm.Name -Force</li>
 	<li>This will stop the VM</li>
 	<li>In PowerShell, type
Set-AzureRmVm -ResourceGroupName $rgName -Name $vm.Name -Generalized</li>
 	<li>This generalizes the VM</li>
 	<li>In PowerShell, type
$imageConfig = New-AzureRmImageConfig -Location $vm.Location -SourceVirtualMachineId $vm.Id
New-AzureRmImage -ImageName $imageName -ResourceGroupName $rgName -Image $imageConfig</li>
 	<li>This creates an image resource containing both the OS &amp; data disks</li>
 	<li>We can see the image in the portal and validate it has two disks in it</li>
</ol>
<h3>Clean up VM</h3>
In order to install a Scale Set in the same availability set, we need to remove the VM.
<ol>
 	<li>In PowerShell, type
Remove-AzureRmVM -ResourceGroupName $rgName -Name $vm.Name -Force
Remove-AzureRmNetworkInterface -ResourceGroupName $rgName -Name frontNic -Force
Remove-AzureRmAvailabilitySet -ResourceGroupName $rgName -Name frontAvailSet -Force</li>
 	<li>Optionally, we can remove the disks
Remove-AzureRmDisk -ResourceGroupName $rgName -DiskName Demo-VM -Force
Remove-AzureRmDisk -ResourceGroupName $rgName -DiskName Demo-VM-data -Force</li>
 	<li>Remove-AzureRmLoadBalancer -ResourceGroupName $rgName -Name PublicLB -Force</li>
</ol>
<h3>Deploy Scale Set</h3>

[code language="JavaScript"]
{
  &quot;$schema&quot;: &quot;https://schema.management.azure.com/schemas/2015-01-01/deploymentTemplate.json#&quot;,
  &quot;contentVersion&quot;: &quot;1.0.0.0&quot;,
  &quot;parameters&quot;: {
    &quot;VM Admin User Name&quot;: {
      &quot;defaultValue&quot;: &quot;myadmin&quot;,
      &quot;type&quot;: &quot;string&quot;
    },
    &quot;VM Admin Password&quot;: {
      &quot;defaultValue&quot;: null,
      &quot;type&quot;: &quot;securestring&quot;
    },
    &quot;Instance Count&quot;: {
      &quot;defaultValue&quot;: 3,
      &quot;type&quot;: &quot;int&quot;
    },
    &quot;VM Size&quot;: {
      &quot;defaultValue&quot;: &quot;Standard_DS4&quot;,
      &quot;type&quot;: &quot;string&quot;,
      &quot;allowedValues&quot;: [
        &quot;Standard_DS1&quot;,
        &quot;Standard_DS2&quot;,
        &quot;Standard_DS3&quot;,
        &quot;Standard_DS4&quot;,
        &quot;Standard_DS5&quot;
      ],
      &quot;metadata&quot;: {
        &quot;description&quot;: &quot;SKU of the VM.&quot;
      }
    },
    &quot;Public Domain Label&quot;: {
      &quot;type&quot;: &quot;string&quot;
    }
  },
  &quot;variables&quot;: {
    &quot;frontIpRange&quot;: &quot;10.0.1.0/24&quot;,
    &quot;Public IP Name&quot;: &quot;MyPublicIP&quot;,
    &quot;Public LB Name&quot;: &quot;PublicLB&quot;,
    &quot;Front Address Pool Name&quot;: &quot;frontPool&quot;,
    &quot;Front Nat Pool Name&quot;: &quot;frontNatPool&quot;,
    &quot;VNET Name&quot;: &quot;Demo-VNet&quot;,
    &quot;NIC Prefix&quot;: &quot;Nic&quot;,
    &quot;Scale Set Name&quot;: &quot;Demo-ScaleSet&quot;,
    &quot;Image Name&quot;: &quot;Demo-VM-Image&quot;,
    &quot;VM Prefix&quot;: &quot;Demo-VM&quot;,
    &quot;IP Config Name&quot;: &quot;ipConfig&quot;
  },
  &quot;resources&quot;: [
    {
      &quot;type&quot;: &quot;Microsoft.Network/publicIPAddresses&quot;,
      &quot;name&quot;: &quot;[variables('Public IP Name')]&quot;,
      &quot;apiVersion&quot;: &quot;2015-06-15&quot;,
      &quot;location&quot;: &quot;[resourceGroup().location]&quot;,
      &quot;tags&quot;: {
        &quot;displayName&quot;: &quot;Public IP&quot;
      },
      &quot;properties&quot;: {
        &quot;publicIPAllocationMethod&quot;: &quot;Dynamic&quot;,
        &quot;idleTimeoutInMinutes&quot;: 4,
        &quot;dnsSettings&quot;: {
          &quot;domainNameLabel&quot;: &quot;[parameters('Public Domain Label')]&quot;
        }
      }
    },
    {
      &quot;type&quot;: &quot;Microsoft.Network/virtualNetworks&quot;,
      &quot;name&quot;: &quot;[variables('VNet Name')]&quot;,
      &quot;apiVersion&quot;: &quot;2016-03-30&quot;,
      &quot;location&quot;: &quot;[resourceGroup().location]&quot;,
      &quot;properties&quot;: {
        &quot;addressSpace&quot;: {
          &quot;addressPrefixes&quot;: [
            &quot;10.0.0.0/16&quot;
          ]
        },
        &quot;subnets&quot;: [
          {
            &quot;name&quot;: &quot;front&quot;,
            &quot;properties&quot;: {
              &quot;addressPrefix&quot;: &quot;[variables('frontIpRange')]&quot;,
              &quot;networkSecurityGroup&quot;: {
                &quot;id&quot;: &quot;[resourceId('Microsoft.Network/networkSecurityGroups', 'frontNsg')]&quot;
              }
            }
          }
        ]
      },
      &quot;resources&quot;: [],
      &quot;dependsOn&quot;: [
        &quot;[resourceId('Microsoft.Network/networkSecurityGroups', 'frontNsg')]&quot;
      ]
    },
    {
      &quot;type&quot;: &quot;Microsoft.Network/loadBalancers&quot;,
      &quot;name&quot;: &quot;[variables('Public LB Name')]&quot;,
      &quot;apiVersion&quot;: &quot;2015-06-15&quot;,
      &quot;location&quot;: &quot;[resourceGroup().location]&quot;,
      &quot;tags&quot;: {
        &quot;displayName&quot;: &quot;Public Load Balancer&quot;
      },
      &quot;properties&quot;: {
        &quot;frontendIPConfigurations&quot;: [
          {
            &quot;name&quot;: &quot;LoadBalancerFrontEnd&quot;,
            &quot;comments&quot;: &quot;Front end of LB:  the IP address&quot;,
            &quot;properties&quot;: {
              &quot;publicIPAddress&quot;: {
                &quot;id&quot;: &quot;[resourceId('Microsoft.Network/publicIPAddresses/', variables('Public IP Name'))]&quot;
              }
            }
          }
        ],
        &quot;backendAddressPools&quot;: [
          {
            &quot;name&quot;: &quot;[variables('Front Address Pool Name')]&quot;
          }
        ],
        &quot;loadBalancingRules&quot;: [],
        &quot;probes&quot;: [
          {
            &quot;name&quot;: &quot;TCP-Probe&quot;,
            &quot;properties&quot;: {
              &quot;protocol&quot;: &quot;Tcp&quot;,
              &quot;port&quot;: 80,
              &quot;intervalInSeconds&quot;: 5,
              &quot;numberOfProbes&quot;: 2
            }
          }
        ],
        &quot;inboundNatPools&quot;: [
          {
            &quot;name&quot;: &quot;[variables('Front Nat Pool Name')]&quot;,
            &quot;properties&quot;: {
              &quot;frontendIPConfiguration&quot;: {
                &quot;id&quot;: &quot;[concat(resourceId('Microsoft.Network/loadBalancers', variables('Public LB Name')), '/frontendIPConfigurations/loadBalancerFrontEnd')]&quot;
              },
              &quot;protocol&quot;: &quot;tcp&quot;,
              &quot;frontendPortRangeStart&quot;: 5000,
              &quot;frontendPortRangeEnd&quot;: 5200,
              &quot;backendPort&quot;: 22
            }
          }
        ]
      },
      &quot;dependsOn&quot;: [
        &quot;[resourceId('Microsoft.Network/publicIPAddresses', variables('Public IP Name'))]&quot;
      ]
    },
    {
      &quot;apiVersion&quot;: &quot;2015-06-15&quot;,
      &quot;name&quot;: &quot;frontNsg&quot;,
      &quot;type&quot;: &quot;Microsoft.Network/networkSecurityGroups&quot;,
      &quot;location&quot;: &quot;[resourceGroup().location]&quot;,
      &quot;tags&quot;: {},
      &quot;properties&quot;: {
        &quot;securityRules&quot;: [
          {
            &quot;name&quot;: &quot;Allow-SSH-From-Everywhere&quot;,
            &quot;properties&quot;: {
              &quot;protocol&quot;: &quot;Tcp&quot;,
              &quot;sourcePortRange&quot;: &quot;*&quot;,
              &quot;destinationPortRange&quot;: &quot;22&quot;,
              &quot;sourceAddressPrefix&quot;: &quot;*&quot;,
              &quot;destinationAddressPrefix&quot;: &quot;*&quot;,
              &quot;access&quot;: &quot;Allow&quot;,
              &quot;priority&quot;: 100,
              &quot;direction&quot;: &quot;Inbound&quot;
            }
          },
          {
            &quot;name&quot;: &quot;Allow-Health-Monitoring&quot;,
            &quot;properties&quot;: {
              &quot;protocol&quot;: &quot;*&quot;,
              &quot;sourcePortRange&quot;: &quot;*&quot;,
              &quot;destinationPortRange&quot;: &quot;*&quot;,
              &quot;sourceAddressPrefix&quot;: &quot;AzureLoadBalancer&quot;,
              &quot;destinationAddressPrefix&quot;: &quot;*&quot;,
              &quot;access&quot;: &quot;Allow&quot;,
              &quot;priority&quot;: 200,
              &quot;direction&quot;: &quot;Inbound&quot;
            }
          },
          {
            &quot;name&quot;: &quot;Disallow-everything-else-Inbound&quot;,
            &quot;properties&quot;: {
              &quot;protocol&quot;: &quot;*&quot;,
              &quot;sourcePortRange&quot;: &quot;*&quot;,
              &quot;destinationPortRange&quot;: &quot;*&quot;,
              &quot;sourceAddressPrefix&quot;: &quot;*&quot;,
              &quot;destinationAddressPrefix&quot;: &quot;*&quot;,
              &quot;access&quot;: &quot;Deny&quot;,
              &quot;priority&quot;: 300,
              &quot;direction&quot;: &quot;Inbound&quot;
            }
          },
          {
            &quot;name&quot;: &quot;Allow-to-VNet&quot;,
            &quot;properties&quot;: {
              &quot;protocol&quot;: &quot;*&quot;,
              &quot;sourcePortRange&quot;: &quot;*&quot;,
              &quot;destinationPortRange&quot;: &quot;*&quot;,
              &quot;sourceAddressPrefix&quot;: &quot;*&quot;,
              &quot;destinationAddressPrefix&quot;: &quot;VirtualNetwork&quot;,
              &quot;access&quot;: &quot;Allow&quot;,
              &quot;priority&quot;: 100,
              &quot;direction&quot;: &quot;Outbound&quot;
            }
          },
          {
            &quot;name&quot;: &quot;Allow-to-8443&quot;,
            &quot;properties&quot;: {
              &quot;protocol&quot;: &quot;*&quot;,
              &quot;sourcePortRange&quot;: &quot;*&quot;,
              &quot;destinationPortRange&quot;: &quot;8443&quot;,
              &quot;sourceAddressPrefix&quot;: &quot;*&quot;,
              &quot;destinationAddressPrefix&quot;: &quot;Internet&quot;,
              &quot;access&quot;: &quot;Allow&quot;,
              &quot;priority&quot;: 200,
              &quot;direction&quot;: &quot;Outbound&quot;
            }
          },
          {
            &quot;name&quot;: &quot;Disallow-everything-else-Outbound&quot;,
            &quot;properties&quot;: {
              &quot;protocol&quot;: &quot;*&quot;,
              &quot;sourcePortRange&quot;: &quot;*&quot;,
              &quot;destinationPortRange&quot;: &quot;*&quot;,
              &quot;sourceAddressPrefix&quot;: &quot;*&quot;,
              &quot;destinationAddressPrefix&quot;: &quot;*&quot;,
              &quot;access&quot;: &quot;Deny&quot;,
              &quot;priority&quot;: 300,
              &quot;direction&quot;: &quot;Outbound&quot;
            }
          }
        ],
        &quot;subnets&quot;: []
      }
    },
    {
      &quot;type&quot;: &quot;Microsoft.Compute/virtualMachineScaleSets&quot;,
      &quot;name&quot;: &quot;[variables('Scale Set Name')]&quot;,
      &quot;location&quot;: &quot;[resourceGroup().location]&quot;,
      &quot;apiVersion&quot;: &quot;2016-04-30-preview&quot;,
      &quot;dependsOn&quot;: [
        &quot;[concat('Microsoft.Network/loadBalancers/', variables('Public LB Name'))]&quot;,
        &quot;[concat('Microsoft.Network/virtualNetworks/', variables('VNET Name'))]&quot;
      ],
      &quot;sku&quot;: {
        &quot;name&quot;: &quot;[parameters('VM Size')]&quot;,
        &quot;tier&quot;: &quot;Standard&quot;,
        &quot;capacity&quot;: &quot;[parameters('Instance Count')]&quot;
      },
      &quot;properties&quot;: {
        &quot;overprovision&quot;: &quot;true&quot;,
        &quot;upgradePolicy&quot;: {
          &quot;mode&quot;: &quot;Manual&quot;
        },
        &quot;virtualMachineProfile&quot;: {
          &quot;storageProfile&quot;: {
            &quot;osDisk&quot;: {
              &quot;createOption&quot;: &quot;FromImage&quot;,
              &quot;managedDisk&quot;: {
                &quot;storageAccountType&quot;: &quot;Premium_LRS&quot;
              }
            },
            &quot;imageReference&quot;: {
              &quot;id&quot;: &quot;[resourceId('Microsoft.Compute/images', variables('Image Name'))]&quot;
            },
            &quot;dataDisks&quot;: [
              {
                &quot;createOption&quot;: &quot;FromImage&quot;,
                &quot;lun&quot;: &quot;2&quot;,
                &quot;managedDisk&quot;: {
                  &quot;storageAccountType&quot;: &quot;Premium_LRS&quot;
                }
              }
            ]
          },
          &quot;osProfile&quot;: {
            &quot;computerNamePrefix&quot;: &quot;[variables('VM Prefix')]&quot;,
            &quot;adminUsername&quot;: &quot;[parameters('VM Admin User Name')]&quot;,
            &quot;adminPassword&quot;: &quot;[parameters('VM Admin Password')]&quot;
          },
          &quot;networkProfile&quot;: {
            &quot;networkInterfaceConfigurations&quot;: [
              {
                &quot;name&quot;: &quot;[variables('NIC Prefix')]&quot;,
                &quot;properties&quot;: {
                  &quot;primary&quot;: &quot;true&quot;,
                  &quot;ipConfigurations&quot;: [
                    {
                      &quot;name&quot;: &quot;[variables('IP Config Name')]&quot;,
                      &quot;properties&quot;: {
                        &quot;subnet&quot;: {
                          &quot;id&quot;: &quot;[concat('/subscriptions/', subscription().subscriptionId,'/resourceGroups/', resourceGroup().name, '/providers/Microsoft.Network/virtualNetworks/', variables('VNET Name'), '/subnets/front')]&quot;
                        },
                        &quot;loadBalancerBackendAddressPools&quot;: [
                          {
                            &quot;id&quot;: &quot;[concat('/subscriptions/', subscription().subscriptionId,'/resourceGroups/', resourceGroup().name, '/providers/Microsoft.Network/loadBalancers/', variables('Public LB Name'), '/backendAddressPools/', variables('Front Address Pool Name'))]&quot;
                          }
                        ],
                        &quot;loadBalancerInboundNatPools&quot;: [
                          {
                            &quot;id&quot;: &quot;[concat('/subscriptions/', subscription().subscriptionId,'/resourceGroups/', resourceGroup().name, '/providers/Microsoft.Network/loadBalancers/', variables('Public LB Name'), '/inboundNatPools/', variables('Front Nat Pool Name'))]&quot;
                          }
                        ]
                      }
                    }
                  ]
                }
              }
            ]
          }
        }
      }
    }
  ]
}
[/code]

You can choose the number of instances, by default there are 3
<h3>Validate Instance</h3>
<ol>
 	<li>Connect to the first instance available using SSH on port 5000 of the public IP</li>
 	<li>SSH ports are NATed from port 5000 up to back-end port 22</li>
 	<li>In the bash shell type
ls /data</li>
 	<li>You should see “mydata”, hence the image carried both the os &amp; data disks</li>
</ol>
<h3>Clean up</h3>
We won’t be using the resource groups we have created so we can delete them

In ISE, type Remove-AzureRmResourceGroup -Name md-demo-image -Force