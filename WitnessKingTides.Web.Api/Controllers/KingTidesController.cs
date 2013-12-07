using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web;
using System.Web.Http;
using WitnessKingTides.Web.Api.Models;
using Newtonsoft.Json;
using System.IO;

namespace WitnessKingTides.Web.Api.Controllers
{
    public class KingTidesController : ApiController
    {
        public IEnumerable<KingTideModel> Get()
        {
            var dataDirectory = AppDomain.CurrentDomain.GetData("DataDirectory").ToString();

            IEnumerable<KingTideModel> kingTides = null;

            using (var reader = File.OpenText(Path.Combine(dataDirectory, "places-king-tides.json")))
            {
                var json = reader.ReadToEnd();

                kingTides = JsonConvert.DeserializeObject<KingTideModel[]>(json);
            }

            return kingTides;
        }
    }
}