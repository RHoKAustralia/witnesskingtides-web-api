using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Web;
using System.Web.Mvc;
using WitnessKingTides.Web.Prototype.Models;
using Newtonsoft.Json;

namespace WitnessKingTides.Web.Prototype.Controllers
{
    public class HomeController : Controller
    {
        // Place in config
        const string WebApiUrl = "http://localhost:12127/api/photo/";

        [HttpPost]
        [ActionName("Index")]
        public ActionResult Index_Post(TideTrackerInputModel inputModel)
        {
            if (Request.Files.Count == 1 && inputModel.Photo!=null) {

                var apiModel = new TideTrackerUploadPhotoApiModel
                {
                    Email = inputModel.Email,
                    FirstName = inputModel.FirstName,
                    LastName = inputModel.LastName,
                    Latitude = inputModel.Latitude,
                    Longitude = inputModel.Longitude
                };

                using (var binaryReader = new BinaryReader(inputModel.Photo.InputStream))
                {
                    apiModel.Photo = binaryReader.ReadBytes(inputModel.Photo.ContentLength);
                }

                var apiData = JsonConvert.SerializeObject(apiModel);
                var client = new WebClient();
                client.Headers.Add("Content-Type", "application/json");
                var response = client.UploadString(new Uri(WebApiUrl), "POST", apiData);

                var outputModel = JsonConvert.DeserializeObject<TideTrackerUploadResult>(response);
                inputModel.FlickrId = outputModel.FlickrId;
            }

            return View(inputModel);
        }
        
        //
        // GET: /Home/
        public ActionResult Index()
        {
            return View();
        }
	}
}