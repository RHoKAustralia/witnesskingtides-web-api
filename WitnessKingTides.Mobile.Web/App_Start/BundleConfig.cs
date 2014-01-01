using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Optimization;

namespace WitnessKingTides.Mobile.Web
{
    public class BundleConfig
    {
        public static void RegisterBundles(BundleCollection bundles)
        {
#if DEBUG
            bool bRelease = false;
#else
            bool bRelease = true;
#endif

            bundles.UseCdn = bRelease;

            if (bRelease)
            {
                //jquery 1.10.2
                bundles.Add(new ScriptBundle("~/bundles/jquery",
                    "//ajax.aspnetcdn.com/ajax/jQuery/jquery-1.10.2.min.js").Include(
                        "~/js/jquery-1.10.2.min.js"));

                //bootstrap 3.0.3
                bundles.Add(new ScriptBundle("~/bundles/bootstrap",
                    "//ajax.aspnetcdn.com/ajax/bootstrap/3.0.3/bootstrap.min.js").Include(
                        "~/js/bootstrap.min.js"));

                bundles.Add(new StyleBundle("~/bundles/bootstrap/base/css",
                    "//ajax.aspnetcdn.com/ajax/bootstrap/3.0.3/css/bootstrap.min.css").Include(
                        "~/css/bootstrap.min.css"));

                bundles.Add(new StyleBundle("~/bundles/bootstrap/theme/css").Include(
                    "~/css/bootstrap-theme.min.css"));

                //underscore 1.5.2
                bundles.Add(new ScriptBundle("~/bundles/underscore",
                    "//cdnjs.cloudflare.com/ajax/libs/underscore.js/1.5.2/underscore-min.js").Include(
                        "~/js/underscore-min.js"));

                //backbone 1.1.0
                bundles.Add(new ScriptBundle("~/bundles/backbone",
                    "//cdnjs.cloudflare.com/ajax/libs/backbone.js/1.1.0/backbone-min.js").Include(
                        "~/js/backbone-min.js"));

                //moment 2.4.0
                bundles.Add(new ScriptBundle("~/bundles/moment", 
                    "//cdnjs.cloudflare.com/ajax/libs/moment.js/2.4.0/moment.min.js").Include(
                        "~/js/moment.min.js"));

                //validate
                bundles.Add(new ScriptBundle("~/bundles/validate").Include("~/js/validate.min.js"));

                //WKT app and libraries without a CDN clone
                bundles.Add(new ScriptBundle("~/bundles/wktapp").Include(
                    "~/js/validate.js",
                    "~/js/bootstrap-datetimepicker.js",
                    "~/js/OpenLayers.debug.js",
                    "~/js/app.js"));

                bundles.Add(new StyleBundle("~/bundles/font-awesome",
                    "//cdnjs.cloudflare.com/ajax/libs/font-awesome/4.0.3/css/font-awesome.min.css").Include(
                        "~/css/font-awesome.min.css"));

                bundles.Add(new StyleBundle("~/bundles/wktapp/css").Include(
                    "~/css/bootstrap-datetimepicker.css",
                    "~/js/theme/default/style.css",
                    "~/css/app.css"));
            }
            else
            {
                //jquery 1.10.2
                bundles.Add(new ScriptBundle("~/bundles/jquery").Include("~/js/jquery-1.10.2.js"));

                //bootstrap 3.0.3
                bundles.Add(new ScriptBundle("~/bundles/bootstrap").Include("~/js/bootstrap.js"));

                bundles.Add(new StyleBundle("~/bundles/bootstrap/base/css").Include(
                    "~/css/bootstrap.css"));

                bundles.Add(new StyleBundle("~/bundles/bootstrap/theme/css").Include(
                    "~/css/bootstrap-theme.css"));

                //underscore 1.5.2
                bundles.Add(new ScriptBundle("~/bundles/underscore").Include(
                    "~/js/underscore-min.js"));

                //backbone 1.1.0
                bundles.Add(new ScriptBundle("~/bundles/backbone").Include(
                    "~/js/backbone-min.js"));

                //moment 2.4.0
                bundles.Add(new ScriptBundle("~/bundles/moment").Include(
                    "~/js/moment.min.js"));

                //WKT app and libraries without a CDN clone
                bundles.Add(new ScriptBundle("~/bundles/wktapp").Include(
                    "~/js/validate.js",
                    "~/js/bootstrap-datetimepicker.js",
                    "~/js/OpenLayers.js",
                    "~/js/app.js"));

                bundles.Add(new StyleBundle("~/bundles/font-awesome").Include(
                    "~/css/font-awesome.css"));

                bundles.Add(new StyleBundle("~/bundles/wktapp/css").Include(
                    "~/css/bootstrap-datetimepicker.css",
                    "~/js/theme/default/style.css",
                    "~/css/app.css"));
            }

            BundleTable.EnableOptimizations = bRelease;
        }
    }
}
